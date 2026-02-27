const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');

class NotificationController {
  /**
   * Get all notifications for user with pagination
   */
  async getNotifications(req, res) {
  try {
    const query = req.query;
    const result = await notificationService.getNotifications(req.user, query);

    const response = ApiResponse.success(
      {
        notifications: result.notifications,
        pagination: result.pagination
      }
    );

    res.json(response);
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

      const notification = await notificationService.markAsRead(req.user, id);

      const response = ApiResponse.success(
        { notification },
        'Notification marked as read'
      );

      res.json(response);
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
      await notificationService.markAllAsRead(req.user);

      const response = ApiResponse.success(
        null,
        'All notifications marked as read'
      );

      res.json(response);
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

      await notificationService.deleteNotification(req.user, id);

      const response = ApiResponse.success(
        null,
        'Notification deleted successfully'
      );

      res.json(response);
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
      const result = await notificationService.getUnreadCount(req.user);

      const response = ApiResponse.success(result);

      res.json(response);
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
      const preferencesData = req.body;

      const user = await notificationService.updatePreferences(req.user, preferencesData);

      const response = ApiResponse.success(
        { user: user.toJSON() },
        'Notification preferences updated successfully'
      );

      res.json(response);
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
      const tokenData = req.body;

      await notificationService.registerDeviceToken(req.user, tokenData);

      const response = ApiResponse.success(
        null,
        'Device token registered successfully'
      );

      res.json(response);
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
      const notificationData = req.body;

      const notification = await notificationService.createTestNotification(req.user, notificationData);

      const response = ApiResponse.success(
        { notification },
        'Test notification created successfully'
      );

      res.json(response);
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
      const notificationData = req.body;

      const notification = await notificationService.sendNotification(notificationData);

      // Emit real-time notification if Socket.IO is available
      if (req.app.get('io')) {
        const io = req.app.get('io');
        
        if (notificationData.userId) {
          io.to(`user-${notificationData.userId}`).emit('notification', notification);
        }
        
        if (notificationData.caregiverId) {
          io.to(`caregiver-${notificationData.caregiverId}`).emit('notification', notification);
        }
      }

      const response = ApiResponse.success(
        { notification },
        'Notification sent successfully',
        201
      );

      res.status(201).json(response);
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
      const notificationTypes = await notificationService.getNotificationTypes();

      const response = ApiResponse.success({ notificationTypes });

      res.json(response);
    } catch (error) {
      logger.error('Get notification types error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationController();