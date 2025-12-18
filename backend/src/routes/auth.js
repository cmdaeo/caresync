const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler')
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters'),
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
  body('newPassword').isLength({ min: 12 }).withMessage('New password must be at least 12 characters')
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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [patient, caregiver, healthcare_provider]
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *         headers:
 *           Set-Cookie:
 *             description: Contains refreshToken in HttpOnly, Secure, SameSite=Strict cookie
 *             schema:
 *               type: string
 *               example: refreshToken=abc123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
 */
router.post('/register', validateRegistration, handleValidationErrors, asyncHandler(authController.register.bind(authController)));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *         headers:
 *           Set-Cookie:
 *             description: Contains refreshToken in HttpOnly, Secure, SameSite=Strict cookie
 *             schema:
 *               type: string
 *               example: refreshToken=abc123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
 */
router.post('/login', validateLogin, handleValidationErrors, asyncHandler(authController.login.bind(authController)));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 */
router.get('/me', authMiddleware, asyncHandler(authController.getProfile.bind(authController)));

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               preferences:
 *                 type: object
 *               emergencyContact:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 */
router.put('/profile', authMiddleware, validateProfileUpdate, handleValidationErrors, asyncHandler(authController.updateProfile.bind(authController)));

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     tags: [Auth]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.put('/password', authMiddleware, validatePasswordChange, handleValidationErrors, asyncHandler(authController.changePassword.bind(authController)));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional - refresh token can also be sent via cookie
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *         headers:
 *           Set-Cookie:
 *             description: Contains new refreshToken in HttpOnly, Secure, SameSite=Strict cookie
 *             schema:
 *               type: string
 *               example: refreshToken=newtoken123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
 */
router.post('/refresh', validateRefreshToken, handleValidationErrors, asyncHandler(authController.refreshToken.bind(authController)));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/logout', authMiddleware, asyncHandler(authController.logout.bind(authController)));

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     tags: [Auth]
 *     summary: Delete user account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete('/account', authMiddleware, asyncHandler(authController.deleteAccount.bind(authController)));

module.exports = router;