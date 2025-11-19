import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONSTANTS, STORAGE_KEYS } from '../config/api';
import Toast from 'react-native-toast-message';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.messageListener = null;
    this.notificationListener = null;
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Request permissions
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('Push notifications permission denied');
        return;
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      // Store token for backend sync
      await this.storeFCMToken(token);

      // Set up message listeners
      this.setupMessageListeners();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');

    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Set up message listeners
   */
  setupMessageListeners() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
      this.handleNotification(remoteMessage);
    });

    // Handle foreground messages
    this.messageListener = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      this.handleNotification(remoteMessage);
    });

    // Handle notification open app
    this.notificationListener = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check if app was opened from notification when closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });
  }

  /**
   * Handle incoming notification
   */
  async handleNotification(message) {
    try {
      const { title, body, data } = message;
      
      // Store notification locally
      await this.storeNotification({
        id: message.messageId,
        title,
        body,
        data,
        timestamp: new Date().toISOString(),
        read: false
      });

      // Show toast notification for foreground messages
      if (message._messageId && !message._sent) {
        Toast.show({
          type: 'info',
          text1: title || 'CareSync',
          text2: body || 'You have a new notification',
          position: 'top',
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 50,
        });
      }

    } catch (error) {
      console.error('Error handling notification:', error);
    }
  }

  /**
   * Handle notification tap
   */
  async handleNotificationOpen(message) {
    try {
      const { data } = message;
      
      // Navigate based on notification type
      if (data?.type) {
        this.handleNotificationAction(data);
      }

      // Mark as read
      await this.markNotificationAsRead(message.messageId);

    } catch (error) {
      console.error('Error handling notification open:', error);
    }
  }

  /**
   * Handle notification action based on type
   */
  handleNotificationAction(data) {
    // This would be connected to navigation service
    // For now, just log the action
    console.log('Notification action:', data.type, data);
    
    switch (data.type) {
      case APP_CONSTANTS.NOTIFICATION_TYPES.MEDICATION_REMINDER:
        // Navigate to medications screen
        break;
      case APP_CONSTANTS.NOTIFICATION_TYPES.MISSED_DOSE:
        // Navigate to adherence screen
        break;
      case APP_CONSTANTS.NOTIFICATION_TYPES.REFILL_REMINDER:
        // Navigate to medications with refill focus
        break;
      case APP_CONSTANTS.NOTIFICATION_TYPES.SYSTEM_ALERT:
        // Show alert or navigate to settings
        break;
      case APP_CONSTANTS.NOTIFICATION_TYPES.CAREGIVER_MESSAGE:
        // Navigate to caregiver messages
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  /**
   * Store FCM token locally and sync with backend
   */
  async storeFCMToken(token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
      
      // TODO: Sync with backend
      // await this.syncFCMTokenWithBackend(token);
      
    } catch (error) {
      console.error('Error storing FCM token:', error);
    }
  }

  /**
   * Store notification locally
   */
  async storeNotification(notification) {
    try {
      const existingNotifications = await this.getStoredNotifications();
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Keep only last 100 notifications
      if (updatedNotifications.length > 100) {
        updatedNotifications.splice(100);
      }
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS, 
        JSON.stringify(updatedNotifications)
      );
      
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Get stored notifications
   */
  async getStoredNotifications() {
    try {
      const notifications = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    try {
      const notifications = await this.getStoredNotifications();
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS, 
        JSON.stringify(updatedNotifications)
      );
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead() {
    try {
      const notifications = await this.getStoredNotifications();
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS, 
        JSON.stringify(updatedNotifications)
      );
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearNotifications() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const notifications = await this.getStoredNotifications();
      return notifications.filter(notif => !notif.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Schedule local notification
   */
  scheduleLocalNotification(title, body, data = {}) {
    // This would use react-native-push-notification
    // Implementation depends on specific notification library choice
    
    // Placeholder for local notification scheduling
    console.log('Scheduling local notification:', { title, body, data });
  }

  /**
   * Cancel scheduled notification
   */
  cancelScheduledNotification(id) {
    // This would use react-native-push-notification
    console.log('Cancelling scheduled notification:', id);
  }

  /**
   * Test notification
   */
  async sendTestNotification() {
    try {
      const testNotification = {
        id: 'test-' + Date.now(),
        title: 'CareSync Test',
        body: 'This is a test notification to verify the system is working correctly.',
        data: { type: 'test' },
        timestamp: new Date().toISOString(),
        read: false
      };

      await this.storeNotification(testNotification);
      
      Toast.show({
        type: 'success',
        text1: 'Test Notification',
        text2: 'Notification system is working correctly!',
      });

    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_PREFS, 
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    try {
      const prefs = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
      return prefs ? JSON.parse(prefs) : {
        medicationReminders: true,
        missedDoses: true,
        refillReminders: true,
        systemAlerts: true,
        caregiverMessages: true,
        sound: true,
        vibration: true
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return {
        medicationReminders: true,
        missedDoses: true,
        refillReminders: true,
        systemAlerts: true,
        caregiverMessages: true,
        sound: true,
        vibration: true
      };
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.messageListener) {
      this.messageListener();
    }
    if (this.notificationListener) {
      this.notificationListener();
    }
    this.isInitialized = false;
  }
}

export default new NotificationService();