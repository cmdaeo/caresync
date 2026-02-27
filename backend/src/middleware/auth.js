const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is missing or invalid'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
       
      // Get user from database to ensure they still exist and are active
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      // Check if token version matches user's current token version
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({
          success: false,
          message: 'Token is invalid due to password change',
          code: 'TOKEN_INVALIDATED'
        });
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (jwtError) {
      // Ignore JWT errors in optional auth
      logger.warn('Optional auth JWT error:', jwtError.message);
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Check if user can access patient data (patient themselves or their caregivers)
const requirePatientAccess = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // Patient accessing their own data
    if (req.user.id === patientId) {
      return next();
    }

    // Caregiver accessing patient data
    if (req.user.role === 'caregiver' || req.user.role === 'healthcare_provider') {
      const { CaregiverPatient } = require('../models');
      
      const caregiverRelationship = await CaregiverPatient.findOne({
        where: {
          caregiverId: req.user.id,
          patientId: patientId,
          isActive: true,
          isVerified: true
        }
      });

      if (caregiverRelationship && caregiverRelationship.hasAccess()) {
        return next();
      }
    }

    // Admin and healthcare providers can access all data
    if (req.user.role === 'admin' || req.user.role === 'healthcare_provider') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to patient data'
    });

  } catch (error) {
    logger.error('Patient access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during access check'
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  requirePatientAccess
};