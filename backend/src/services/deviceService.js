const { Device, DeviceAccessPermission, DeviceInvitation, User } = require('../models');
const logger = require('../utils/logger');
const JwtUtils = require('../utils/jwtUtils');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { AppError, NotFoundError, ConflictError, AuthenticationError } = require('../middleware/errorHandler');

class DeviceService {

  /**
   * Get all devices for a user
   */
  async getDevices(user) {
    const devices = await Device.findAll({
      where: { userId: user.id, isActive: true },
      order: [['createdAt', 'DESC']]
    });

    return devices;
  }

  /**
   * Register a new device (Legacy method - kept for backward compatibility)
   */
  async registerDevice(user, deviceData) {
    const { deviceId, name, deviceType, model, serialNumber } = deviceData;

    // Check if device already exists
    const existingDevice = await Device.findOne({ where: { deviceId } });
    if (existingDevice) {
      throw new ConflictError('Device with this ID is already registered');
    }

    const device = await Device.create({
      userId: user.id,
      deviceId,
      name,
      deviceType,
      model,
      serialNumber,
      batteryStatus: 'unknown',
      connectionStatus: 'offline'
    });

    logger.info(`New device registered: ${name} (${deviceId}) for user ${user.email}`);

    return device;
  }

  /**
   * Register a new device using signature-based authentication
   */
  async registerDeviceWithSignature(user, deviceData) {
    const { deviceId, devicePublicKey, signature, name, deviceType, model, serialNumber } = deviceData;

    // Validate required fields
    if (!deviceId || !devicePublicKey || !signature) {
      throw new AppError('deviceId, devicePublicKey, and signature are required', 400);
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({ where: { deviceId } });
    if (existingDevice) {
      throw new ConflictError('Device with this ID is already registered');
    }

    // Verify the signature
    let decodedToken;
    try {
      decodedToken = await JwtUtils.verifyDeviceSignature(signature, devicePublicKey);
    } catch (verifyError) {
      logger.warn(`Signature verification failed for device ${deviceId}: ${verifyError.message}`);
      throw new AuthenticationError('Invalid device signature');
    }

    // Validate that the signature is intended for this device and user
    if (decodedToken.aud !== `carebox-${deviceId}` || decodedToken.sub !== user.id) {
      throw new AuthenticationError('Signature not valid for this device and user combination');
    }

    // Create the device with signature information
    const device = await Device.create({
      userId: user.id,
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
      userId: user.id,
      accessLevel: 'full_access',
      grantedBy: user.id
    });

    logger.info(`New device registered with signature: ${name} (${deviceId}) for user ${user.email}`);

    return device;
  }

  /**
   * Get single device details
   */
  async getDevice(user, id) {
    const device = await Device.findOne({
      where: { id, userId: user.id }
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    return device;
  }

  /**
   * Update device settings
   */
  async updateDevice(user, id, deviceData) {
    const device = await Device.findOne({
      where: { id, userId: user.id }
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    await device.update(deviceData);

    return device;
  }

  /**
   * Remove device (Soft Delete)
   */
  async deleteDevice(user, id) {
    const device = await Device.findOne({
      where: { id, userId: user.id }
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    await device.update({ isActive: false });
    logger.info(`Device removed: ${device.name} for user ${user.email}`);

    return { success: true, message: 'Device removed successfully' };
  }

  /**
   * Sync device status (Webhook/Ping endpoint)
   */
  async syncStatus(deviceId, statusData) {
    const { batteryLevel, connectionStatus, status } = statusData;

    const device = await Device.findOne({ where: { deviceId } });
    if (!device) {
      throw new NotFoundError('Device not found');
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

    return { success: true, message: 'Device synced' };
  }

  /**
   * Invite a caregiver to access a device
   */
  async inviteCaregiver(user, deviceId, invitationData) {
    const { email, accessLevel = 'read_only' } = invitationData;

    // Validate access level
    if (!['read_only', 'full_access'].includes(accessLevel)) {
      throw new AppError('Invalid access level. Must be read_only or full_access', 400);
    }

    // Check if device exists and belongs to user
    const device = await Device.findOne({
      where: { id: deviceId, userId: user.id, isActive: true }
    });

    if (!device) {
      throw new NotFoundError('Device not found or you do not have permission');
    }

    // Check if user already has access
    const existingPermission = await DeviceAccessPermission.findOne({
      where: { deviceId, userId: user.id }
    });

    if (existingPermission) {
      throw new ConflictError('User already has access to this device');
    }

    // Generate unique invitation token
    const invitationToken = uuidv4();

    // Create invitation
    const invitation = await DeviceInvitation.create({
      deviceId,
      email,
      accessLevel,
      invitationToken,
      createdBy: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    logger.info(`Caregiver invitation created for ${email} to device ${deviceId} by user ${user.email}`);

    return invitation;
  }

  /**
   * Accept a caregiver invitation
   */
  async acceptCaregiverInvitation(user, deviceId, invitationId) {
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
      throw new NotFoundError('Invitation not found, already accepted, or expired');
    }

    // Check if the current user matches the invitation email
    if (invitation.email !== user.email) {
      throw new AuthenticationError('This invitation is not intended for your account');
    }

    // Check if user already has access
    const existingPermission = await DeviceAccessPermission.findOne({
      where: { deviceId, userId: user.id }
    });

    if (existingPermission) {
      throw new ConflictError('You already have access to this device');
    }

    // Create access permission
    const permission = await DeviceAccessPermission.create({
      deviceId,
      userId: user.id,
      accessLevel: invitation.accessLevel,
      grantedBy: invitation.createdBy
    });

    // Update invitation status
    await invitation.update({
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedBy: user.id
    });

    logger.info(`Caregiver invitation accepted by ${user.email} for device ${deviceId}`);

    return permission;
  }

  /**
   * Get all caregivers for a device
   */
  async getDeviceCaregivers(user, deviceId) {
    // Check if device exists and user has permission
    const device = await Device.findOne({
      where: { id: deviceId, userId: user.id, isActive: true }
    });

    if (!device) {
      throw new NotFoundError('Device not found or you do not have permission');
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

    return permissions.map(perm => ({
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
    }));
  }

  /**
   * Remove caregiver access from a device
   */
  async removeCaregiver(user, deviceId, caregiverId) {
    // Check if device exists and user has permission
    const device = await Device.findOne({
      where: { id: deviceId, userId: user.id, isActive: true }
    });

    if (!device) {
      throw new NotFoundError('Device not found or you do not have permission');
    }

    // Find and remove the permission
    const permission = await DeviceAccessPermission.findOne({
      where: { deviceId, userId: caregiverId }
    });

    if (!permission) {
      throw new NotFoundError('Caregiver access not found');
    }

    // Only allow removal if current user is the device owner or has full access
    const currentUserPermission = await DeviceAccessPermission.findOne({
      where: { deviceId, userId: user.id }
    });

    if (!currentUserPermission || currentUserPermission.accessLevel !== 'full_access') {
      throw new AuthenticationError('You do not have permission to remove caregivers');
    }

    // Soft delete the permission
    await permission.update({ isActive: false });

    logger.info(`Caregiver ${caregiverId} removed from device ${deviceId} by user ${user.email}`);

    return { success: true, message: 'Caregiver access removed successfully' };
  }
}

module.exports = new DeviceService();