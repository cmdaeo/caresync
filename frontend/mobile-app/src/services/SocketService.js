import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';
import NotificationService from './NotificationService';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
  }

  /**
   * Initialize socket connection
   * @param {string} serverUrl - Server URL
   */
  async initialize(serverUrl = 'http://localhost:5000') {
    try {
      const token = await AuthService.getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      this.socket = io(serverUrl, {
        auth: {
          token
        },
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      this.setupEventListeners();
      this.connect();

    } catch (error) {
      console.error('Error initializing socket:', error);
      throw error;
    }
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.joinUserRoom();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // CareSync specific events
    this.socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      this.handleNotification(notification);
    });

    this.socket.on('medication_reminder', (reminder) => {
      console.log('Medication reminder:', reminder);
      this.handleMedicationReminder(reminder);
    });

    this.socket.on('adherence_update', (data) => {
      console.log('Adherence update:', data);
      this.handleAdherenceUpdate(data);
    });

    this.socket.on('device_status', (status) => {
      console.log('Device status update:', status);
      this.handleDeviceStatus(status);
    });

    this.socket.on('caregiver_alert', (alert) => {
      console.log('Caregiver alert:', alert);
      this.handleCaregiverAlert(alert);
    });

    this.socket.on('system_alert', (alert) => {
      console.log('System alert:', alert);
      this.handleSystemAlert(alert);
    });

    // Room management
    this.socket.on('joined-user', (data) => {
      console.log('Joined user room:', data);
    });

    this.socket.on('joined-caregiver', (data) => {
      console.log('Joined caregiver room:', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handleSocketError(error);
    });
  }

  /**
   * Connect to socket server
   */
  connect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Join user room for personalized notifications
   */
  async joinUserRoom() {
    try {
      const user = await AuthService.getStoredUser();
      if (user && this.socket) {
        this.socket.emit('join-user', user.id);
      }
    } catch (error) {
      console.error('Error joining user room:', error);
    }
  }

  /**
   * Join caregiver room for caregiver notifications
   */
  async joinCaregiverRoom() {
    try {
      const user = await AuthService.getStoredUser();
      if (user && user.role === 'caregiver' && this.socket) {
        this.socket.emit('join-caregiver', user.id);
      }
    } catch (error) {
      console.error('Error joining caregiver room:', error);
    }
  }

  /**
   * Handle incoming notifications
   * @param {Object} notification - Notification data
   */
  handleNotification(notification) {
    // Store notification locally
    NotificationService.storeNotification(notification);

    // Emit to listeners
    this.emit('notification', notification);

    // Show local notification if app is in foreground
    this.showLocalNotification(notification);
  }

  /**
   * Handle medication reminders
   * @param {Object} reminder - Reminder data
   */
  handleMedicationReminder(reminder) {
    this.emit('medication_reminder', reminder);
    this.showLocalNotification({
      type: 'medication_reminder',
      title: 'Medication Reminder',
      body: `It's time to take ${reminder.medicationName}`,
      data: reminder
    });
  }

  /**
   * Handle adherence updates
   * @param {Object} data - Adherence update data
   */
  handleAdherenceUpdate(data) {
    this.emit('adherence_update', data);
  }

  /**
   * Handle device status updates
   * @param {Object} status - Device status data
   */
  handleDeviceStatus(status) {
    this.emit('device_status', status);
  }

  /**
   * Handle caregiver alerts
   * @param {Object} alert - Caregiver alert data
   */
  handleCaregiverAlert(alert) {
    this.emit('caregiver_alert', alert);
    this.showLocalNotification({
      type: 'caregiver_alert',
      title: 'Caregiver Alert',
      body: alert.message,
      data: alert
    });
  }

  /**
   * Handle system alerts
   * @param {Object} alert - System alert data
   */
  handleSystemAlert(alert) {
    this.emit('system_alert', alert);
    this.showLocalNotification({
      type: 'system_alert',
      title: alert.title || 'System Alert',
      body: alert.message,
      data: alert
    });
  }

  /**
   * Handle socket errors
   * @param {Error} error - Socket error
   */
  handleSocketError(error) {
    console.error('Socket error:', error);
    // You might want to implement error reporting here
  }

  /**
   * Show local notification
   * @param {Object} notification - Notification data
   */
  showLocalNotification(notification) {
    // This would integrate with the local notification system
    console.log('Showing local notification:', notification);
    
    // You can use react-native-push-notification here
    // For now, we'll just log it
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).push(callback);
    } else {
      this.eventListeners.set(event, [callback]);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const callbacks = this.eventListeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Send message to server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot send:', event);
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean} Connection status
   */
  isSocketConnected() {
    return this.isConnected;
  }

  /**
   * Get socket ID
   * @returns {string|null} Socket ID
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  /**
   * Update authentication token
   * @param {string} newToken - New authentication token
   */
  async updateAuthToken(newToken) {
    if (this.socket) {
      this.socket.auth = { token: newToken };
      
      // Reconnect with new token if currently connected
      if (this.isConnected) {
        this.disconnect();
        this.connect();
      }
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.disconnect();
    this.eventListeners.clear();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket = null;
    }
  }

  /**
   * Send medication confirmation
   * @param {Object} medicationData - Medication confirmation data
   */
  sendMedicationConfirmation(medicationData) {
    this.send('medication_confirmed', {
      medicationId: medicationData.medicationId,
      confirmationTime: new Date().toISOString(),
      method: medicationData.method || 'manual',
      ...medicationData
    });
  }

  /**
   * Send device sync request
   * @param {string} deviceId - Device ID
   */
  requestDeviceSync(deviceId) {
    this.send('sync_device', { deviceId });
  }

  /**
   * Send caregiver notification
   * @param {Object} notificationData - Notification data for caregiver
   */
  sendCaregiverNotification(notificationData) {
    this.send('caregiver_notification', {
      ...notificationData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Request real-time status update
   */
  requestStatusUpdate() {
    this.send('request_status_update', {
      timestamp: new Date().toISOString()
    });
  }
}

export default new SocketService();