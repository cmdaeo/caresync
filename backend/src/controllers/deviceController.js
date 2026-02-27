const deviceService = require('../services/deviceService');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');

class DeviceController {
  /**
   * Get all devices for a user
   */
  async getDevices(req, res) {
    try {
      const devices = await deviceService.getDevices(req.user);

      const response = ApiResponse.success({ devices });

      res.json(response);
    } catch (error) {
      logger.error('Get devices error:', error);
      throw error;
    }
  }

  /**
   * Register a new device (Legacy method - kept for backward compatibility)
   */
  async registerDevice(req, res) {
    try {
      const deviceData = req.body;
      const device = await deviceService.registerDevice(req.user, deviceData);

      const response = ApiResponse.success(
        { device },
        'Device registered successfully',
        201
      );

      res.status(201).json(response);
    } catch (error) {
      logger.error('Register device error:', error);
      throw error;
    }
  }

  /**
   * Register a new device using signature-based authentication
   */
  async registerDeviceWithSignature(req, res) {
    try {
      const deviceData = req.body;
      const device = await deviceService.registerDeviceWithSignature(req.user, deviceData);

      const response = ApiResponse.success(
        {
          device: {
            ...device.toJSON(),
            registrationSignature: undefined,
            devicePublicKey: undefined
          }
        },
        'Device registered successfully with signature',
        201
      );

      res.status(201).json(response);
    } catch (error) {
      logger.error('Register device with signature error:', error);
      throw error;
    }
  }

  /**
   * Get single device details
   */
  async getDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await deviceService.getDevice(req.user, id);

      const response = ApiResponse.success({ device });

      res.json(response);
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
      const deviceData = req.body;
      const device = await deviceService.updateDevice(req.user, id, deviceData);

      const response = ApiResponse.success(
        { device },
        'Device updated successfully'
      );

      res.json(response);
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
      await deviceService.deleteDevice(req.user, id);

      const response = ApiResponse.success(
        null,
        'Device removed successfully'
      );

      res.json(response);
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
      const statusData = req.body;
      await deviceService.syncStatus(req.user, deviceId, statusData);

      const response = ApiResponse.success(
        null,
        'Device synced'
      );

      res.json(response);
    } catch (error) {
      logger.error('Sync device error:', error);
      throw error;
    }
  }
  /**
   * Invite a caregiver to access a device
   */
  async inviteCaregiver(req, res) {
    try {
      const { deviceId } = req.params;
      const invitationData = req.body;
      const invitation = await deviceService.inviteCaregiver(req.user, deviceId, invitationData);

      const response = ApiResponse.success(
        {
          invitation: {
            id: invitation.id,
            email: invitation.email,
            accessLevel: invitation.accessLevel,
            invitationToken: invitation.invitationToken,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt
          }
        },
        'Caregiver invitation created successfully',
        201
      );

      res.status(201).json(response);
    } catch (error) {
      logger.error('Invite caregiver error:', error);
      throw error;
    }
  }

  /**
   * Accept a caregiver invitation
   */
  async acceptCaregiverInvitation(req, res) {
    try {
      const { deviceId, invitationId } = req.params;
      const permission = await deviceService.acceptCaregiverInvitation(req.user, deviceId, invitationId);

      const response = ApiResponse.success(
        {
          permission: {
            id: permission.id,
            deviceId: permission.deviceId,
            accessLevel: permission.accessLevel,
            grantedAt: permission.grantedAt
          }
        },
        'Caregiver invitation accepted successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Accept caregiver invitation error:', error);
      throw error;
    }
  }

  /**
   * Get all caregivers for a device
   */
  async getDeviceCaregivers(req, res) {
    try {
      const { deviceId } = req.params;
      const caregivers = await deviceService.getDeviceCaregivers(req.user, deviceId);

      const response = ApiResponse.success({ caregivers });

      res.json(response);
    } catch (error) {
      logger.error('Get device caregivers error:', error);
      throw error;
    }
  }

  /**
   * Remove caregiver access from a device
   */
  async removeCaregiver(req, res) {
    try {
      const { deviceId, caregiverId } = req.params;
      await deviceService.removeCaregiver(req.user, deviceId, caregiverId);

      const response = ApiResponse.success(
        null,
        'Caregiver access removed successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Remove caregiver error:', error);
      throw error;
    }
  }
}

module.exports = new DeviceController();
