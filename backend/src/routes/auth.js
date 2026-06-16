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

const validateRoleChange = [
  body('newRole')
    .isIn(['patient', 'caregiver'])
    .withMessage('Role must be patient or caregiver'),
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *         headers:
 *           Set-Cookie:
 *             description: Contains refreshToken in HttpOnly, Secure, SameSite=Strict cookie
 *             schema:
 *               type: string
 *               example: refreshToken=abc123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', validateRegistration, handleValidationErrors, asyncHandler(authController.register.bind(authController)));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link request acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "If that email is registered, you will receive a reset link shortly."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/forgot-password',
  body('email').isEmail().withMessage('Please provide a valid email'),
  handleValidationErrors,
  asyncHandler(authController.forgotPassword.bind(authController))
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 12
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password has been reset successfully. Please sign in."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/reset-password',
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters'),
  handleValidationErrors,
  asyncHandler(authController.resetPassword.bind(authController))
);

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
 *         description: Login successful or 2FA challenge required
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Login successful"
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Two-factor authentication required"
 *                     data:
 *                       type: object
 *                       properties:
 *                         requiresTwoFactor:
 *                           type: boolean
 *                           example: true
 *                         tempToken:
 *                           type: string
 *         headers:
 *           Set-Cookie:
 *             description: Contains refreshToken in HttpOnly, Secure, SameSite=Strict cookie (only if 2FA not required)
 *             schema:
 *               type: string
 *               example: refreshToken=abc123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
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
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 *               preferences:
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/profile', authMiddleware, validateProfileUpdate, handleValidationErrors, asyncHandler(authController.updateProfile.bind(authController)));

/**
 * @swagger
 * /api/auth/role:
 *   put:
 *     tags: [Auth]
 *     summary: Change user role (patient/caregiver)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newRole, currentPassword]
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [patient, caregiver]
 *               currentPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Role changed to caregiver. All previous data was wiped. Please sign in again."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid password or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/role',
  authMiddleware,
  validateRoleChange,
  handleValidationErrors,
  asyncHandler(authController.changeRole.bind(authController))
);

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
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: "Password changed successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid current password or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *                   example: true
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully"
 *       401:
 *         description: Invalid password or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/account', authMiddleware, asyncHandler(authController.deleteAccount.bind(authController)));

module.exports = router;