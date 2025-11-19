const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler')
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('role').optional().isIn(['patient', 'caregiver', 'healthcare_provider']).withMessage('Invalid role')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const validateProfileUpdate = [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
];

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

// Validation handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Routes

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegistration, handleValidationErrors, asyncHandler(authController.register.bind(authController)));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, handleValidationErrors, asyncHandler(authController.login.bind(authController)));

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authMiddleware, asyncHandler(authController.getProfile.bind(authController)));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', authMiddleware, validateProfileUpdate, handleValidationErrors, asyncHandler(authController.updateProfile.bind(authController)));

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', authMiddleware, validatePasswordChange, handleValidationErrors, asyncHandler(authController.changePassword.bind(authController)));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', validateRefreshToken, handleValidationErrors, asyncHandler(authController.refreshToken.bind(authController)));

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authMiddleware, asyncHandler(authController.logout.bind(authController)));

module.exports = router;