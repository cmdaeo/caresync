const { Device, DeviceAccessPermission, DeviceInvitation, User } = require('../models');
const logger = require('../utils/logger');
const JwtUtils = require('../utils/jwtUtils');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

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
   * Register a new device (Legacy method - kept for backward compatibility)
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
   * Register a new device using signature-based authentication
   */
  async registerDeviceWithSignature(req, res) {
    try {
      const { deviceId, devicePublicKey, signature, name, deviceType, model, serialNumber } = req.body;

      // Validate required fields
      if (!deviceId || !devicePublicKey || !signature) {
        return res.status(400).json({
          success: false,
          message: 'deviceId, devicePublicKey, and signature are required'
        });
      }

      // Check if device already exists
      const existingDevice = await Device.findOne({ where: { deviceId } });
      if (existingDevice) {
        return res.status(409).json({
          success: false,
          message: 'Device with this ID is already registered'
        });
      }

      // Verify the signature
      let decodedToken;
      try {
        decodedToken = await JwtUtils.verifyDeviceSignature(signature, devicePublicKey);
      } catch (verifyError) {
        logger.warn(`Signature verification failed for device ${deviceId}: ${verifyError.message}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid device signature'
        });
      }

      // Validate that the signature is intended for this device and user
      if (decodedToken.aud !== `carebox-${deviceId}` || decodedToken.sub !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Signature not valid for this device and user combination'
        });
      }

      // Create the device with signature information
      const device = await Device.create({
        userId: req.user.id,
        deviceId,
        devicePublicKey,
        registrationSignature: signature,
        name: name || `CareBox ${deviceId}`,
        deviceType: deviceType || 'carebox',
        model: model || 'CBX-2000',
        serialNumber: serialNumber || deviceId,
        registrationDate: new Date()
      });

      // Automatically grant full access to the registering user
      await DeviceAccessPermission.create({
        deviceId: device.id,
        userId: req.user.id,
        accessLevel: 'full_access',
        grantedBy: req.user.id
      });

      logger.info(`New device registered with signature: ${name} (${deviceId}) for user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Device registered successfully with signature',
        data: {
          device: {
            ...device.toJSON(),
            // Don't return sensitive signature data
            registrationSignature: undefined,
            devicePublicKey: undefined
          }
        }
      });
    } catch (error) {
      logger.error('Register device with signature error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register device',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
  /**
   * Invite a caregiver to access a device
   */
  async inviteCaregiver(req, res) {
    try {
      const { deviceId } = req.params;
      const { email, accessLevel = 'read_only' } = req.body;

      // Validate access level
      if (!['read_only', 'full_access'].includes(accessLevel)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid access level. Must be read_only or full_access'
        });
      }

      // Check if device exists and belongs to user
      const device = await Device.findOne({
        where: { id: deviceId, userId: req.user.id, isActive: true }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or you do not have permission'
        });
      }

      // Check if user already has access
      const existingPermission = await DeviceAccessPermission.findOne({
        where: { deviceId, userId: req.user.id }
      });

      if (existingPermission) {
        return res.status(409).json({
          success: false,
          message: 'User already has access to this device'
        });
      }

      // Generate unique invitation token
      const invitationToken = uuidv4();

      // Create invitation
      const invitation = await DeviceInvitation.create({
        deviceId,
        email,
        accessLevel,
        invitationToken,
        createdBy: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });

      logger.info(`Caregiver invitation created for ${email} to device ${deviceId} by user ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Caregiver invitation created successfully',
        data: {
          invitation: {
            id: invitation.id,
            email: invitation.email,
            accessLevel: invitation.accessLevel,
            invitationToken: invitation.invitationToken,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Invite caregiver error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create caregiver invitation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Accept a caregiver invitation
   */
  async acceptCaregiverInvitation(req, res) {
    try {
      const { deviceId, invitationId } = req.params;

      // Find the invitation
      const invitation = await DeviceInvitation.findOne({
        where: {
          id: invitationId,
          deviceId,
          status: 'pending',
          expiresAt: { [Op.gt]: new Date() }
        }
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found, already accepted, or expired'
        });
      }

      // Check if the current user matches the invitation email
      if (invitation.email !== req.user.email) {
        return res.status(403).json({
          success: false,
          message: 'This invitation is not intended for your account'
        });
      }

      // Check if user already has access
      const existingPermission = await DeviceAccessPermission.findOne({
        where: { deviceId, userId: req.user.id }
      });

      if (existingPermission) {
        return res.status(409).json({
          success: false,
          message: 'You already have access to this device'
        });
      }

      // Create access permission
      const permission = await DeviceAccessPermission.create({
        deviceId,
        userId: req.user.id,
        accessLevel: invitation.accessLevel,
        grantedBy: invitation.createdBy
      });

      // Update invitation status
      await invitation.update({
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: req.user.id
      });

      logger.info(`Caregiver invitation accepted by ${req.user.email} for device ${deviceId}`);

      res.json({
        success: true,
        message: 'Caregiver invitation accepted successfully',
        data: {
          permission: {
            id: permission.id,
            deviceId: permission.deviceId,
            accessLevel: permission.accessLevel,
            grantedAt: permission.grantedAt
          }
        }
      });
    } catch (error) {
      logger.error('Accept caregiver invitation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept caregiver invitation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all caregivers for a device
   */
  async getDeviceCaregivers(req, res) {
    try {
      const { deviceId } = req.params;

      // Check if device exists and user has permission
      const device = await Device.findOne({
        where: { id: deviceId, userId: req.user.id, isActive: true }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or you do not have permission'
        });
      }

      // Get all access permissions for this device
      const permissions = await DeviceAccessPermission.findAll({
        where: { deviceId, isActive: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }]
      });

      res.json({
        success: true,
        data: {
          caregivers: permissions.map(perm => ({
            id: perm.id,
            userId: perm.userId,
            accessLevel: perm.accessLevel,
            grantedAt: perm.grantedAt,
            grantedBy: perm.grantedBy,
            user: perm.user ? {
              id: perm.user.id,
              name: `${perm.user.firstName} ${perm.user.lastName}`,
              email: perm.user.email
            } : null
          }))
        }
      });
    } catch (error) {
      logger.error('Get device caregivers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get device caregivers',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Remove caregiver access from a device
   */
  async removeCaregiver(req, res) {
    try {
      const { deviceId, caregiverId } = req.params;

      // Check if device exists and user has permission
      const device = await Device.findOne({
        where: { id: deviceId, userId: req.user.id, isActive: true }
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found or you do not have permission'
        });
      }

      // Find and remove the permission
      const permission = await DeviceAccessPermission.findOne({
        where: { deviceId, userId: caregiverId }
      });

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Caregiver access not found'
        });
      }

      // Only allow removal if current user is the device owner or has full access
      const currentUserPermission = await DeviceAccessPermission.findOne({
        where: { deviceId, userId: req.user.id }
      });

      if (!currentUserPermission || currentUserPermission.accessLevel !== 'full_access') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to remove caregivers'
        });
      }

      // Soft delete the permission
      await permission.update({ isActive: false });

      logger.info(`Caregiver ${caregiverId} removed from device ${deviceId} by user ${req.user.email}`);

      res.json({
        success: true,
        message: 'Caregiver access removed successfully'
      });
    } catch (error) {
      logger.error('Remove caregiver error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove caregiver access',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new DeviceController();
