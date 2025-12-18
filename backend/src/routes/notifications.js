const express = require('express');
const router = express.Router();
const { User, CaregiverPatient, Notification } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger');
const { body, query, param, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get all notifications for user with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [medication_reminder, missed_dose, refill_reminder, device_alert, system_alert, caregiver_alert]
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 */
// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
router.get(
  '/',
  [
    authMiddleware,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('read').optional().isBoolean().withMessage('Read must be a boolean'),
    query('type').optional().isIn(['medication_reminder', 'missed_dose', 'refill_reminder', 'device_alert', 'system_alert', 'caregiver_alert']).withMessage('Invalid notification type')
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

    const { page = 1, limit = 20, read, type } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
        userId: req.user.id  // <--- SIMPLIFIED: Only check userId
    };

    if (read !== undefined) whereClause.isRead = read === 'true';
    if (type) whereClause.type = type;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      // FIX: Remove 'as' aliases if they aren't defined in the model
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'] // No 'as' alias
        }
      ]
    });

    res.json({
      success: true,
      data: {
        notifications,
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

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
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
 *                     notification:
 *                       type: object
 */
// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put(
  '/:id/read',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid notification ID')
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

    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        [require('sequelize').Op.or]: [
          { userId: req.user.id },
          { caregiverId: req.user.id }
        ]
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.update({ isRead: true, readAt: new Date() });

    logger.info(`Notification marked as read: ${notification.id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification
      }
    });
  })
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put(
  '/read-all',
  authMiddleware,
  asyncHandler(async (req, res) => {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          [require('sequelize').Op.or]: [
            { userId: req.user.id },
            { caregiverId: req.user.id }
          ],
          isRead: false
        }
      }
    );

    logger.info(`All notifications marked as read by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  })
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
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
// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete(
  '/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid notification ID')
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

    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        [require('sequelize').Op.or]: [
          { userId: req.user.id },
          { caregiverId: req.user.id }
        ]
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    logger.info(`Notification deleted: ${notification.id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  })
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count retrieved successfully
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
 *                     unreadCount:
 *                       type: integer
 */
// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', authMiddleware, asyncHandler(async (req, res) => {
  const count = await Notification.count({
    where: {
      [require('sequelize').Op.or]: [
        { userId: req.user.id },
        { caregiverId: req.user.id }
      ],
      isRead: false
    }
  });

  res.json({
    success: true,
    data: {
      unreadCount: count
    }
  });
}));

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     tags: [Notifications]
 *     summary: Update notification preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *               push:
 *                 type: boolean
 *               sms:
 *                 type: boolean
 *               medicationReminders:
 *                 type: boolean
 *               missedDoseAlerts:
 *                 type: boolean
 *               refillReminders:
 *                 type: boolean
 *               deviceAlerts:
 *                 type: boolean
 *               caregiverAlerts:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
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
// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
router.put(
  '/preferences',
  [
    authMiddleware,
    body('email').optional().isBoolean().withMessage('Email preference must be a boolean'),
    body('push').optional().isBoolean().withMessage('Push preference must be a boolean'),
    body('sms').optional().isBoolean().withMessage('SMS preference must be a boolean'),
    body('medicationReminders').optional().isBoolean().withMessage('Medication reminders preference must be a boolean'),
    body('missedDoseAlerts').optional().isBoolean().withMessage('Missed dose alerts preference must be a boolean'),
    body('refillReminders').optional().isBoolean().withMessage('Refill reminders preference must be a boolean'),
    body('deviceAlerts').optional().isBoolean().withMessage('Device alerts preference must be a boolean'),
    body('caregiverAlerts').optional().isBoolean().withMessage('Caregiver alerts preference must be a boolean')
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

    const user = req.user;
    const {
      email,
      push,
      sms,
      medicationReminders,
      missedDoseAlerts,
      refillReminders,
      deviceAlerts,
      caregiverAlerts
    } = req.body;

    // Update notification preferences in user profile
    const updates = {};
    
    if (email !== undefined || push !== undefined || sms !== undefined) {
      updates.notifications = {
        ...user.preferences.notifications,
        ...(email !== undefined && { email }),
        ...(push !== undefined && { push }),
        ...(sms !== undefined && { sms })
      };
    }

    if (medicationReminders !== undefined || missedDoseAlerts !== undefined ||
        refillReminders !== undefined || deviceAlerts !== undefined || caregiverAlerts !== undefined) {
      updates.notificationSettings = {
        ...user.preferences.notificationSettings,
        ...(medicationReminders !== undefined && { medicationReminders }),
        ...(missedDoseAlerts !== undefined && { missedDoseAlerts }),
        ...(refillReminders !== undefined && { refillReminders }),
        ...(deviceAlerts !== undefined && { deviceAlerts }),
        ...(caregiverAlerts !== undefined && { caregiverAlerts })
      };
    }

    await user.update({ preferences: updates });

    logger.info(`Notification preferences updated for user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  })
);

/**
 * @swagger
 * /api/notifications/register-token:
 *   post:
 *     tags: [Notifications]
 *     summary: Register device token for push notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *     responses:
 *       200:
 *         description: Device token registered successfully
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
// @desc    Register device token for push notifications
// @route   POST /api/notifications/register-token
// @access  Private
router.post(
  '/register-token',
  [
    authMiddleware,
    body('token').notEmpty().trim().withMessage('Device token is required'),
    body('platform').isIn(['ios', 'android', 'web']).withMessage('Invalid platform')
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

    const { token, platform } = req.body;

    // Store device token (you'll need to create a DeviceToken model)
    // For now, we'll store it in user preferences
    const user = req.user;
    const deviceTokens = user.preferences.deviceTokens || {};
    deviceTokens[platform] = token;

    await user.update({
      preferences: {
        ...user.preferences,
        deviceTokens
      }
    });

    logger.info(`Device token registered for user ${req.user.email} on ${platform}`);

    res.json({
      success: true,
      message: 'Device token registered successfully'
    });
  })
);

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     tags: [Notifications]
 *     summary: Create test notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [medication_reminder, missed_dose, refill_reminder, device_alert, system_alert]
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test notification created successfully
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
 *                     notification:
 *                       type: object
 */
// @desc    Test notification
// @route   POST /api/notifications/test
// @access  Private
router.post(
  '/test',
  [
    authMiddleware,
    body('type').isIn(['medication_reminder', 'missed_dose', 'refill_reminder', 'device_alert', 'system_alert']).withMessage('Invalid notification type'),
    body('message').optional().trim().isLength({ max: 500 }).withMessage('Message too long')
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

    const { type, message } = req.body;

    // Create test notification
    const notification = await Notification.create({
      userId: req.user.id,
      type,
      title: 'Test Notification',
      message: message || 'This is a test notification from CareSync',
      isRead: false,
      priority: 'normal'
    });

    logger.info(`Test notification created: ${type} for user ${req.user.email}`);

    // In a real application, you would also send the push notification here
    // await sendPushNotification(req.user, notification);

    res.json({
      success: true,
      message: 'Test notification created successfully',
      data: {
        notification
      }
    });
  })
);

module.exports = router;