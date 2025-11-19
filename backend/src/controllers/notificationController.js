const { User, CaregiverPatient, Notification } = require('../models');
const logger = require('../utils/logger');

class NotificationController {
  /**
   * Get all notifications for user with pagination
   */
  async getNotifications(req, res) {
    try {
      const { page = 1, limit = 20, read, type } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = { 
        [require('sequelize').Op.or]: [
          { userId: req.user.id },
          { caregiverId: req.user.id }
        ]
      };

      if (read !== undefined) whereClause.isRead = read === 'true';
      if (type) whereClause.type = type;

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'caregiver',
            attributes: ['id', 'firstName', 'lastName']
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
    } catch (error) {
      logger.error('Get notifications error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: {
          id,
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
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
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
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: {
          id,
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
    } catch (error) {
      logger.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req, res) {
    try {
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
    } catch (error) {
      logger.error('Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(req, res) {
    try {
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

      const user = req.user;

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
    } catch (error) {
      logger.error('Update notification preferences error:', error);
      throw error;
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(req, res) {
    try {
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
    } catch (error) {
      logger.error('Register device token error:', error);
      throw error;
    }
  }

  /**
   * Create test notification
   */
  async createTestNotification(req, res) {
    try {
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
    } catch (error) {
      logger.error('Create test notification error:', error);
      throw error;
    }
  }

  /**
   * Send notification to user (for system use)
   */
  async sendNotification(req, res) {
    try {
      const {
        userId,
        caregiverId,
        type,
        title,
        message,
        data = {},
        priority = 'normal'
      } = req.body;

      // Validate required fields
      if (!userId && !caregiverId) {
        return res.status(400).json({
          success: false,
          message: 'Either userId or caregiverId is required'
        });
      }

      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Type, title, and message are required'
        });
      }

      // Create notification
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

      // Emit real-time notification if Socket.IO is available
      if (req.app.get('io')) {
        const io = req.app.get('io');
        
        if (userId) {
          io.to(`user-${userId}`).emit('notification', notification);
        }
        
        if (caregiverId) {
          io.to(`caregiver-${caregiverId}`).emit('notification', notification);
        }
      }

      logger.info(`Notification sent: ${type} for user ${userId || caregiverId}`);

      res.status(201).json({
        success: true,
        message: 'Notification sent successfully',
        data: {
          notification
        }
      });
    } catch (error) {
      logger.error('Send notification error:', error);
      throw error;
    }
  }

  /**
   * Get notification types and their descriptions
   */
  async getNotificationTypes(req, res) {
    try {
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

      res.json({
        success: true,
        data: {
          notificationTypes
        }
      });
    } catch (error) {
      logger.error('Get notification types error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationController();