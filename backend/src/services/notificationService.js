const { User, CaregiverPatient, Notification } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { AppError, NotFoundError } = require('../middleware/errorHandler');

class NotificationService {

  /**
   * Get all notifications for user with pagination
   */
  async getNotifications(user, query) {
    const { page = 1, limit = 20, read, type } = query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      [Op.or]: [
        { userId: user.id },
        { caregiverId: user.id }
      ]
    };

    if (read !== undefined) {
      whereClause.isRead = read === 'true';
    }

    if (type) {
      whereClause.type = type;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    return {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(user, id) {
    const notification = await Notification.findOne({
      where: {
        id,
        [Op.or]: [
          { userId: user.id },
          { caregiverId: user.id }
        ]
      }
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await notification.update({ isRead: true, readAt: new Date() });

    logger.info(`Notification marked as read: ${notification.id} by user ${user.email}`);

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(user) {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          [Op.or]: [
            { userId: user.id },
            { caregiverId: user.id }
          ],
          isRead: false
        }
      }
    );

    logger.info(`All notifications marked as read by user ${user.email}`);

    return { success: true };
  }

  /**
   * Delete notification
   */
  async deleteNotification(user, id) {
    const notification = await Notification.findOne({
      where: {
        id,
        [Op.or]: [
          { userId: user.id },
          { caregiverId: user.id }
        ]
      }
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await notification.destroy();

    logger.info(`Notification deleted: ${notification.id} by user ${user.email}`);

    return { success: true };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(user) {
    const count = await Notification.count({
      where: {
        [Op.or]: [
          { userId: user.id },
          { caregiverId: user.id }
        ],
        isRead: false
      }
    });

    return { unreadCount: count };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(user, preferencesData) {
    const {
      email,
      push,
      sms,
      medicationReminders,
      missedDoseAlerts,
      refillReminders,
      deviceAlerts,
      caregiverAlerts
    } = preferencesData;

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

    logger.info(`Notification preferences updated for user ${user.email}`);

    return user;
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(user, tokenData) {
    const { token, platform } = tokenData;

    const deviceTokens = user.preferences.deviceTokens || {};
    deviceTokens[platform] = token;

    await user.update({
      preferences: {
        ...user.preferences,
        deviceTokens
      }
    });

    logger.info(`Device token registered for user ${user.email} on ${platform}`);

    return { success: true };
  }

  /**
   * Create test notification
   */
  async createTestNotification(user, notificationData) {
    const { type, message } = notificationData;

    const notification = await Notification.create({
      userId: user.id,
      type,
      title: 'Test Notification',
      message: message || 'This is a test notification from CareSync',
      isRead: false,
      priority: 'normal'
    });

    logger.info(`Test notification created: ${type} for user ${user.email}`);

    return notification;
  }

  /**
   * Send notification to user (for system use)
   */
  async sendNotification(notificationData) {
    const {
      userId,
      caregiverId,
      type,
      title,
      message,
      data = {},
      priority = 'normal'
    } = notificationData;

    // Validate required fields
    if (!userId && !caregiverId) {
      throw new AppError('Either userId or caregiverId is required', 400);
    }

    if (!type || !title || !message) {
      throw new AppError('Type, title, and message are required', 400);
    }

    const notification = await Notification.create({
      userId,
      caregiverId,
      type,
      title,
      message,
      data,
      priority,
      isRead: false
    });

    logger.info(`Notification sent: ${type} for user ${userId || caregiverId}`);

    return notification;
  }

  /**
   * Get notification types and their descriptions
   */
  async getNotificationTypes() {
    const notificationTypes = {
      medication_reminder: {
        name: 'Medication Reminder',
        description: 'Reminders to take scheduled medications',
        priority: 'high',
        category: 'medication'
      },
      missed_dose: {
        name: 'Missed Dose Alert',
        description: 'Alerts when a dose has been missed',
        priority: 'high',
        category: 'medication'
      },
      refill_reminder: {
        name: 'Refill Reminder',
        description: 'Reminders to refill medications',
        priority: 'medium',
        category: 'medication'
      },
      device_alert: {
        name: 'Device Alert',
        description: 'Alerts from connected devices (CareBox, CareBand)',
        priority: 'medium',
        category: 'device'
      },
      system_alert: {
        name: 'System Alert',
        description: 'General system notifications and updates',
        priority: 'low',
        category: 'system'
      },
      caregiver_alert: {
        name: 'Caregiver Alert',
        description: 'Alerts sent to caregivers about patient status',
        priority: 'high',
        category: 'caregiver'
      }
    };

    return notificationTypes;
  }
}

module.exports = new NotificationService();