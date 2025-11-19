const express = require('express');
const router = express.Router();
const { User, CaregiverPatient } = require('../models');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger');
const { body, query, param, validationResult } = require('express-validator');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}));

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put(
  '/profile',
  [
    authMiddleware,
    body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object'),
    body('emergencyContact').optional().isObject().withMessage('Emergency contact must be an object')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, dateOfBirth, preferences, emergencyContact } = req.body;
    const user = req.user;

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (preferences !== undefined) user.preferences = { ...user.preferences, ...preferences };
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  })
);

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get(
  '/',
  [
    authMiddleware,
    requireRole('admin'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['patient', 'caregiver', 'healthcare_provider', 'admin']).withMessage('Invalid role'),
    query('status').optional().isIn(['active', 'inactive', 'all']).withMessage('Invalid status')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, role, status = 'active' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (role) whereClause.role = role;
    if (status !== 'all') whereClause.isActive = status === 'active';

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] }
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  })
);

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private (Admin)
router.get(
  '/:id',
  [
    authMiddleware,
    requireRole('admin'),
    param('id').isUUID().withMessage('Invalid user ID')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] },
      include: [
        {
          model: CaregiverPatient,
          as: 'caregiving',
          include: [{
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        },
        {
          model: CaregiverPatient,
          as: 'careReceiving',
          include: [{
            model: User,
            as: 'caregiver',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  })
);

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin)
router.put(
  '/:id',
  [
    authMiddleware,
    requireRole('admin'),
    param('id').isUUID().withMessage('Invalid user ID'),
    body('role').optional().isIn(['patient', 'caregiver', 'healthcare_provider', 'admin']).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    await user.update(req.body);

    logger.info(`User updated by admin: ${user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  })
);

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
router.delete(
  '/:id',
  [
    authMiddleware,
    requireRole('admin'),
    param('id').isUUID().withMessage('Invalid user ID')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by setting isActive to false
    await user.update({ isActive: false });

    logger.info(`User deactivated by admin: ${user.email}`);

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  })
);

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
router.get(
  '/search',
  [
    authMiddleware,
    query('q').notEmpty().trim().withMessage('Search query is required'),
    query('type').optional().isIn(['caregiver', 'patient', 'healthcare_provider']).withMessage('Invalid user type')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { q, type } = req.query;

    // Build search conditions
    const searchConditions = {
      [require('sequelize').Op.or]: [
        { firstName: { [require('sequelize').Op.iLike]: `%${q}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${q}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${q}%` } }
      ],
      isActive: true
    };

    if (type) {
      searchConditions.role = type;
    }

    // Exclude current user from search results
    searchConditions.id = { [require('sequelize').Op.ne]: req.user.id };

    const users = await User.findAll({
      where: searchConditions,
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profilePicture'],
      limit: 20,
      order: [['firstName', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        users,
        count: users.length
      }
    });
  })
);

// @desc    Get user statistics (admin only)
// @route   GET /api/users/stats
// @access  Private (Admin)
router.get('/stats', authMiddleware, requireRole('admin'), asyncHandler(async (req, res) => {
  const { Sequelize } = require('sequelize');
  const Op = Sequelize.Op;

  const stats = await Promise.all([
    User.count({ where: { isActive: true } }),
    User.count({ where: { role: 'patient', isActive: true } }),
    User.count({ where: { role: 'caregiver', isActive: true } }),
    User.count({ where: { role: 'healthcare_provider', isActive: true } }),
    User.count({
      where: {
        isActive: true,
        createdAt: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalUsers: stats[0],
      patients: stats[1],
      caregivers: stats[2],
      healthcareProviders: stats[3],
      newUsersThisMonth: stats[4]
    }
  });
}));

module.exports = router;