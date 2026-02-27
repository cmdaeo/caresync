// services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Medication, Prescription, Adherence, Device, DeviceAccessPermission, DeviceInvitation, CaregiverPatient, Notification, sequelize } = require('../models');
const logger = require('../utils/logger');
const { AppError, AuthenticationError, ConflictError } = require('../middleware/errorHandler');
const AuditLogService = require('./auditLogService');
const { encrypt } = require('../utils/encryption');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

const hashRefreshToken = async (token) => await bcrypt.hash(token, 10);
const compareRefreshToken = async (token, hash) => await bcrypt.compare(token, hash);

class AuthService {
  async register(userData) {
    const { email, password, firstName, lastName, role = 'patient', phone, dateOfBirth } = userData;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) throw new ConflictError('User already exists with this email');

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email, password, firstName, lastName, role, phone, dateOfBirth, emailVerificationToken
    });

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    logger.info(`New user registered: ${email}`);

    await AuditLogService.logAction({
      userId: user.id, action: 'USER_REGISTERED', entityType: 'User', entityId: user.id,
      newValues: { email: user.email, role: user.role }
    });

    return { user, token, refreshToken };
  }

  async login(email, password, context = {}) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new AuthenticationError('Invalid credentials');
    if (!user.isActive) throw new AuthenticationError('Account is inactive. Please contact support.');

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new AuthenticationError('Invalid credentials');

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    logger.info(`User logged in: ${email}`);

    await AuditLogService.logAction({
      userId: user.id, action: 'USER_LOGIN', entityType: 'User', entityId: user.id,
      metadata: { ipAddress: context.ip || 'unknown', userAgent: context.userAgent || 'unknown' }
    });

    return { user, token, refreshToken };
  }

  async getProfile(user) {
    return user;
  }

  async updateProfile(user, profileData) {
    const { firstName, lastName, phone, dateOfBirth, preferences, emergencyContact } = profileData;

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

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) throw new AppError('Current password is incorrect', 400);

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    return user;
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) throw new AuthenticationError('Refresh token is required');

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') throw new AuthenticationError('Invalid token type');

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) throw new AuthenticationError('User not found or inactive');

    if (user.refreshTokenHash) {
      const isValid = await compareRefreshToken(refreshToken, user.refreshTokenHash);
      if (!isValid) throw new AuthenticationError('Invalid refresh token');
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user.id);
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

    user.refreshTokenHash = newRefreshTokenHash;
    await user.save();

    return { token: newToken, refreshToken: newRefreshToken };
  }

  async logout(user) {
    user.refreshTokenHash = null;
    await user.save();
    logger.info(`User logged out: ${user.email}`);
    return { success: true };
  }

  async deleteAccount(userContext, password) {
    const user = await User.findByPk(userContext.id);
    if (!user) throw new AuthenticationError('User not found');

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new AppError('Password is incorrect', 400);

    // Preserve encrypted PII for audit before wiping
    const preservedAuditData = {
      email: encrypt(user.email),
      firstName: encrypt(user.firstName),
      lastName: encrypt(user.lastName)
    };

    const userId = user.id;

    // GDPR cascade delete: destroy ALL health data in a single transaction
    // to prevent partial deletions if any query fails
    const t = await sequelize.transaction();
    try {
      // 1. Delete health data (hard delete — GDPR right to erasure)
      await Adherence.destroy({ where: { userId }, transaction: t });
      await Prescription.destroy({ where: { userId }, transaction: t });
      await Medication.destroy({ where: { userId }, transaction: t });
      await Notification.destroy({ where: { userId }, transaction: t });

      // 2. Delete device relationships
      await DeviceAccessPermission.destroy({ where: { [Op.or]: [{ userId }, { grantedBy: userId }] }, transaction: t });
      await DeviceInvitation.destroy({ where: { [Op.or]: [{ createdBy: userId }, { acceptedBy: userId }] }, transaction: t });
      await Device.destroy({ where: { userId }, transaction: t });

      // 3. Delete caregiver links
      await CaregiverPatient.destroy({ where: { [Op.or]: [{ patientId: userId }, { caregiverId: userId }] }, transaction: t });

      // 4. Anonymize user record (keep for audit trail integrity)
      user.firstName = 'Anonymized';
      user.lastName = 'User';
      user.email = `anonymized_${userId}_${Date.now()}@deleted.example.com`;
      user.phone = null;
      user.dateOfBirth = null;
      user.profilePicture = null;
      user.isActive = false;
      user.refreshTokenHash = null;
      user.emergencyContact = null;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save({ transaction: t });

      await t.commit();
    } catch (error) {
      await t.rollback();
      logger.error(`GDPR cascade delete failed for user ${userId}:`, error);
      throw new AppError('Account deletion failed. No data was modified. Please try again.', 500);
    }

    logger.info(`User account deleted (GDPR cascade): ${userId}`);

    await AuditLogService.logAction({
      userId, action: 'USER_ACCOUNT_DELETED', entityType: 'User', entityId: userId,
      oldValues: preservedAuditData,
      newValues: { email: user.email, firstName: user.firstName, lastName: user.lastName },
      metadata: { encrypted: true, description: 'User account deleted. All health data hard-deleted. PII in oldValues is encrypted for legal hold.' }
    });

    return { success: true };
  }

  /**
   * Forgot Password
   * Generates a secure token, stores its hash in the DB, and logs the reset URL to console.
   * NEVER tells the caller whether the email exists (prevents email enumeration attacks).
   */
  async forgotPassword(email) {
    const user = await User.findOne({ where: { email } });

    // Always return true even if user not found — this prevents attackers from
    // probing which emails are registered in the system.
    if (!user || !user.isActive) {
      logger.info(`Password reset requested for unknown/inactive email: ${email}`);
      return true;
    }

    // 1. Generate raw random token (sent in URL)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash it for safe storage in DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 3. Save hash + 15-minute expiry to user record
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // 4. Build the reset URL with the RAW token (not the hash)
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // 5. MOCK EMAIL: Print to console during development
    //    Replace this block with your email provider (SendGrid, Resend, etc.) later
    logger.info('='.repeat(64));
    logger.info(`[MOCK EMAIL] TO: ${email}`);
    logger.info(`[MOCK EMAIL] SUBJECT: CareSync Password Reset`);
    logger.info(`[MOCK EMAIL] LINK: ${resetUrl}`);
    logger.info(`[MOCK EMAIL] EXPIRES IN: 15 minutes`);
    logger.info('='.repeat(64));

    await AuditLogService.logAction({
      userId: user.id, action: 'PASSWORD_RESET_REQUESTED', entityType: 'User', entityId: user.id,
      metadata: { email: user.email }
    });

    return true;
  }

  /**
   * Reset Password
   * Takes the raw token from the URL, hashes it, and looks it up in the DB.
   * If it matches and hasn't expired, updates the password and invalidates all sessions.
   */
  async resetPassword(rawToken, newPassword) {
    // 1. Hash the incoming token to compare with what's stored
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 2. Find the user whose hashed token matches AND has not yet expired
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: new Date() } // Must be in the future
      }
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired', 400);
    }

    // 3. Set new password (the model hook will hash it automatically)
    user.password = newPassword;

    // 4. Clear the reset token fields so the link can never be used again
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // 5. Invalidate ALL existing sessions (force re-login everywhere)
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.refreshTokenHash = null;

    await user.save();

    logger.info(`Password reset successfully for: ${user.email}`);

    await AuditLogService.logAction({
      userId: user.id, action: 'PASSWORD_RESET_COMPLETED', entityType: 'User', entityId: user.id,
      metadata: { email: user.email }
    });

    return true;
  }

    /**
     * Change User Role (Destructive)
     * Wipes all associated data and changes the role between patient/caregiver
     */
    async changeRole(userId, newRole, currentPassword) {
      const user = await User.findByPk(userId);
      if (!user) throw new AuthenticationError('User not found');

      // 1. Verify password for this destructive action
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) throw new AppError('Current password is incorrect', 400);

      // 2. Validate roles
      if (user.role === newRole) throw new AppError(`You are already a ${newRole}`, 400);
      if (!['patient', 'caregiver'].includes(newRole)) throw new AppError('Invalid role selection', 400);
      if (!['patient', 'caregiver'].includes(user.role)) throw new AppError('Your current role cannot be changed', 400);

      // 3. Wipe ALL data in a transaction to prevent partial deletions
      const t = await sequelize.transaction();
      try {
        await CaregiverPatient.destroy({ where: { [Op.or]: [{ patientId: userId }, { caregiverId: userId }] }, transaction: t });
        await DeviceAccessPermission.destroy({ where: { [Op.or]: [{ userId }, { grantedBy: userId }] }, transaction: t });
        await DeviceInvitation.destroy({ where: { [Op.or]: [{ createdBy: userId }] }, transaction: t });
        await Adherence.destroy({ where: { userId }, transaction: t });
        await Prescription.destroy({ where: { userId }, transaction: t });
        await Medication.destroy({ where: { userId }, transaction: t });
        await Device.destroy({ where: { userId }, transaction: t });
        await Notification.destroy({ where: { userId }, transaction: t });

        // 4. Update Role and force re-login
        const oldRole = user.role;
        user.role = newRole;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.refreshTokenHash = null;
        await user.save({ transaction: t });

        await t.commit();

        logger.info(`User ${user.email} changed role from ${oldRole} to ${newRole} and data was wiped.`);

        await AuditLogService.logAction({
          userId: user.id, action: 'USER_ROLE_CHANGED', entityType: 'User', entityId: user.id,
          oldValues: { role: oldRole }, newValues: { role: newRole },
          metadata: { description: 'Role changed and all associated patient/caregiver data wiped.' }
        });

        return user;
      } catch (error) {
        await t.rollback();
        logger.error(`Role change transaction failed for user ${userId}:`, error);
        throw new AppError('Role change failed. No data was modified. Please try again.', 500);
      }
    }

}

module.exports = new AuthService();
