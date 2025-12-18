const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const logger = require('../utils/logger');
const { AppError, AuthenticationError, AuthorizationError, ConflictError } = require('../middleware/errorHandler');
const AuditLogService = require('./auditLogService');
const { encrypt } = require('../utils/encryption');

// FIXED: Synchronous function accepting USER object
// No need to query DB again since we already have the user
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      tokenVersion: user.tokenVersion // Include version for force logout
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

// Hash refresh token for storage
const hashRefreshToken = async (token) => {
  return await bcrypt.hash(token, 10);
};

// Compare refresh token with stored hash
const compareRefreshToken = async (token, hash) => {
  return await bcrypt.compare(token, hash);
};

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, firstName, lastName, role = 'patient', phone, dateOfBirth } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('User already exists with this email');
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      dateOfBirth,
      emailVerificationToken
    });

    // FIXED: Pass user object, not just ID
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    // Store refresh token hash in user record
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    logger.info(`New user registered: ${email}`);

    // Audit log for user registration
    await AuditLogService.logAction({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      newValues: {
        email: user.email,
        role: user.role
      }
    });

    return { user, token, refreshToken };
  }

  /**
   * Login user
   */
  async login(email, password, context = {}) {
    // Check if user exists and include password for comparison
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive. Please contact support.');
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // FIXED: Pass user object, not just ID
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    // Store refresh token hash in user record
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    logger.info(`User logged in: ${email}`);

    // Audit log for user login
    await AuditLogService.logAction({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: {
        ipAddress: context.ip || 'unknown',
        userAgent: context.userAgent || 'unknown'
      }
    });

    return { user, token, refreshToken };
  }

  /**
   * Get current user profile
   */
  async getProfile(user) {
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(user, profileData) {
    const { firstName, lastName, phone, dateOfBirth, preferences, emergencyContact } = profileData;

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (preferences !== undefined) user.preferences = { ...user.preferences, ...preferences };
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    // Increment token version to invalidate existing tokens
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    return user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    // Verify user still exists and is active
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Verify refresh token matches stored hash (detect token reuse)
    if (user.refreshTokenHash) {
      const isValid = await compareRefreshToken(refreshToken, user.refreshTokenHash);
      if (!isValid) {
        throw new AuthenticationError('Invalid refresh token');
      }
    }

    // Generate new tokens
    // FIXED: Pass user object
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user.id);
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

    // Implement token rotation: invalidate old token by storing new hash
    user.refreshTokenHash = newRefreshTokenHash;
    await user.save();

    return { token: newToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout user
   */
  async logout(user) {
    // Clear refresh token hash to invalidate the token
    user.refreshTokenHash = null;
    await user.save();

    logger.info(`User logged out: ${user.email}`);

    return { success: true };
  }

  /**
   * Delete user account
   */
  async deleteAccount(userContext, password) {
    // 1. Fetch user (to get password hash and full data)
    const user = await User.findByPk(userContext.id);

    if (!user) {
        throw new AuthenticationError('User not found');
    }

    // 2. Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Password is incorrect', 400);
    }

    // 3. CAPTURE & ENCRYPT DATA BEFORE DELETION
    // We encrypt the sensitive fields so we have a record, but it's private.
    const preservedAuditData = {
        email: encrypt(user.email),
        firstName: encrypt(user.firstName),
        lastName: encrypt(user.lastName)
    };

    // 4. Anonymize the User Record in the Database (GDPR)
    // This makes the user unrecognizable in the active database
    user.firstName = 'Anonymized';
    user.lastName = 'User';
    user.email = `anonymized_${user.id}_${Date.now()}@deleted.example.com`;
    user.phone = null;
    user.dateOfBirth = null;
    user.profilePicture = null;
    user.isActive = false;
    user.refreshTokenHash = null;
    user.deletedAt = new Date();
    
    // Clear emergency contact
    user.emergencyContact = {
      name: '',
      phone: '',
      relationship: ''
    };
    
    await user.save();

    logger.info(`User account anonymized: ${user.id}`);

    // 5. Create Audit Log with ENCRYPTED Old Values
    // This satisfies legal retention (data exists) AND privacy (data is unreadable)
    await AuditLogService.logAction({
      userId: user.id,
      action: 'USER_ACCOUNT_DELETED',
      entityType: 'User',
      entityId: user.id,
      oldValues: preservedAuditData, // <--- SAVING ENCRYPTED DATA HERE
      newValues: {
        email: user.email, // Already anonymized string
        firstName: user.firstName,
        lastName: user.lastName
      },
      metadata: {
        encrypted: true,
        description: "User account deleted. PII in oldValues is encrypted."
      }
    });

    return { success: true };
  }
}

module.exports = new AuthService();
