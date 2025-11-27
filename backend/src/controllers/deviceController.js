const { Device } = require('../models');
const logger = require('../utils/logger');

class DeviceController {
  /**
   * Get all devices for a user
   */
  async getDevices(req, res) {
    try {
      const devices = await Device.findAll({
        where: { userId: req.user.id, isActive: true },
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { devices }
      });
    } catch (error) {
      logger.error('Get devices error:', error);
      throw error;
    }
  }

  /**
   * Register a new device
   */
  async registerDevice(req, res) {
    try {
      const { deviceId, name, deviceType, model, serialNumber } = req.body;

      // Check if device already exists
      const existingDevice = await Device.findOne({ where: { deviceId } });
      if (existingDevice) {
        return res.status(409).json({
          success: false,
          message: 'Device with this ID is already registered'
        });
      }

      const device = await Device.create({
        userId: req.user.id,
        deviceId,
        name,
        deviceType,
        model,
        serialNumber,
        batteryStatus: 'unknown',
        connectionStatus: 'offline'
      });

      logger.info(`New device registered: ${name} (${deviceId}) for user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Device registered successfully',
        data: { device }
      });
    } catch (error) {
      logger.error('Register device error:', error);
      throw error;
    }
  }

  /**
   * Get single device details
   */
  async getDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findOne({
        where: { id, userId: req.user.id }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: { device }
      });
    } catch (error) {
      logger.error('Get device error:', error);
      throw error;
    }
  }

  /**
   * Update device settings
   */
  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findOne({
        where: { id, userId: req.user.id }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      await device.update(req.body);

      res.json({
        success: true,
        message: 'Device updated successfully',
        data: { device }
      });
    } catch (error) {
      logger.error('Update device error:', error);
      throw error;
    }
  }

  /**
   * Remove device (Soft Delete)
   */
  async deleteDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await Device.findOne({
        where: { id, userId: req.user.id }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      await device.update({ isActive: false });
      logger.info(`Device removed: ${device.name} for user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Device removed successfully'
      });
    } catch (error) {
      logger.error('Delete device error:', error);
      throw error;
    }
  }

  /**
   * Sync device status (Webhook/Ping endpoint)
   */
  async syncStatus(req, res) {
    try {
      const { deviceId } = req.params;
      const { batteryLevel, connectionStatus, status } = req.body;

      const device = await Device.findOne({ where: { deviceId } });
      if (!device) {
        return res.status(404).json({ success: false, message: 'Device not found' });
      }

      const updates = {
        lastSync: new Date(),
        status: { ...device.status, ...status }
      };

      if (batteryLevel !== undefined) {
        updates.batteryLevel = batteryLevel;
        updates.batteryStatus = batteryLevel > 20 ? 'good' : 'low';
      }

      if (connectionStatus) {
        updates.connectionStatus = connectionStatus;
        updates.lastConnection = new Date();
      }

      await device.update(updates);
      res.json({ success: true, message: 'Device synced' });
    } catch (error) {
      logger.error('Sync device error:', error);
      throw error;
    }
  }
}

module.exports = new DeviceController();
