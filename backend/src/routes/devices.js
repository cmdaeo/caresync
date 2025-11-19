const express = require('express');
const router = express.Router();
const { Device, Adherence } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger');
const { body, query, param, validationResult } = require('express-validator');
const crypto = require('crypto');

// @desc    Get all devices for user
// @route   GET /api/devices
// @access  Private
router.get(
  '/',
  [
    authMiddleware,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('deviceType').optional().isIn(['carebox', 'careband']).withMessage('Invalid device type'),
    query('status').optional().isIn(['online', 'offline', 'syncing', 'error']).withMessage('Invalid status')
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

    const { page = 1, limit = 20, deviceType, status } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = { userId: req.user.id };
    if (deviceType) whereClause.deviceType = deviceType;
    if (status) whereClause.connectionStatus = status;

    const { count, rows: devices } = await Device.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        devices,
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

// @desc    Get single device
// @route   GET /api/devices/:id
// @access  Private
router.get(
  '/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid device ID')
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

    const device = await Device.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: Adherence,
        as: 'adherenceRecords',
        limit: 10,
        order: [['scheduledTime', 'DESC']]
      }]
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: {
        device
      }
    });
  })
);

// @desc    Register new device
// @route   POST /api/devices
// @access  Private
router.post(
  '/',
  [
    authMiddleware,
    body('deviceType').isIn(['carebox', 'careband']).withMessage('Invalid device type'),
    body('name').notEmpty().trim().withMessage('Device name is required'),
    body('model').optional().trim().isLength({ max: 50 }).withMessage('Model too long'),
    body('serialNumber').optional().trim().isLength({ max: 50 }).withMessage('Serial number too long'),
    body('firmwareVersion').optional().trim().isLength({ max: 20 }).withMessage('Firmware version too long'),
    body('hardwareVersion').optional().trim().isLength({ max: 20 }).withMessage('Hardware version too long')
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

    const deviceData = {
      ...req.body,
      userId: req.user.id,
      deviceId: crypto.randomBytes(16).toString('hex'),
      pairingToken: crypto.randomBytes(32).toString('hex')
    };

    const device = await Device.create(deviceData);

    logger.info(`New device registered: ${device.deviceType} ${device.name} for user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: {
        device
      }
    });
  })
);

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private
router.put(
  '/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid device ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Device name must be between 1 and 100 characters'),
    body('batteryLevel').optional().isInt({ min: 0, max: 100 }).withMessage('Battery level must be between 0 and 100'),
    body('connectionStatus').optional().isIn(['online', 'offline', 'syncing', 'error']).withMessage('Invalid connection status'),
    body('settings').optional().isObject().withMessage('Settings must be an object'),
    body('status').optional().isObject().withMessage('Status must be an object')
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

    const device = await Device.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Update the device
    await device.update(req.body);

    logger.info(`Device updated: ${device.name} (${device.deviceType}) by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: {
        device
      }
    });
  })
);

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private
router.delete(
  '/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid device ID')
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

    const device = await Device.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Soft delete by setting isActive to false
    await device.update({ isActive: false });

    logger.info(`Device deactivated: ${device.name} (${device.deviceType}) by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Device deactivated successfully'
    });
  })
);

// @desc    Update device status (for device-to-server communication)
// @route   POST /api/devices/:id/status
// @access  Private (Device authentication would be needed in production)
router.post(
  '/:id/status',
  [
    param('id').isUUID().withMessage('Invalid device ID'),
    body('batteryLevel').optional().isInt({ min: 0, max: 100 }).withMessage('Battery level must be between 0 and 100'),
    body('batteryStatus').optional().isIn(['charging', 'full', 'low', 'critical', 'unknown']).withMessage('Invalid battery status'),
    body('connectionStatus').optional().isIn(['online', 'offline', 'syncing', 'error']).withMessage('Invalid connection status'),
    body('status').optional().isObject().withMessage('Status must be an object'),
    body('location').optional().isObject().withMessage('Location must be an object')
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

    const device = await Device.findOne({
      where: {
        id: req.params.id,
        isActive: true
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const { batteryLevel, batteryStatus, connectionStatus, status, location } = req.body;
    
    const updates = {
      lastConnection: new Date(),
      lastSync: new Date()
    };

    if (batteryLevel !== undefined) updates.batteryLevel = batteryLevel;
    if (batteryStatus !== undefined) updates.batteryStatus = batteryStatus;
    if (connectionStatus !== undefined) updates.connectionStatus = connectionStatus;
    if (status !== undefined) updates.status = { ...device.status, ...status };
    if (location !== undefined) updates.location = location;

    await device.update(updates);

    logger.info(`Device status updated: ${device.name} (${device.deviceType})`);

    res.json({
      success: true,
      message: 'Device status updated successfully',
      data: {
        device
      }
    });
  })
);

// @desc    Generate pairing code for device
// @route   POST /api/devices/:id/pair
// @access  Private
router.post(
  '/:id/pair',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid device ID')
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

    const device = await Device.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Generate new pairing token
    const pairingToken = crypto.randomBytes(32).toString('hex');
    await device.update({ pairingToken, isPaired: false });

    logger.info(`Pairing code generated for device: ${device.name} (${device.deviceType})`);

    res.json({
      success: true,
      message: 'Pairing code generated successfully',
      data: {
        pairingToken,
        deviceId: device.deviceId,
        deviceType: device.deviceType
      }
    });
  })
);

// @desc    Get device statistics
// @route   GET /api/devices/stats
// @access  Private
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const { Sequelize } = require('sequelize');
  const Op = Sequelize.Op;

  const deviceStats = await Promise.all([
    // Total devices
    Device.count({ where: { userId: req.user.id, isActive: true } }),
    
    // CareBox devices
    Device.count({ where: { userId: req.user.id, deviceType: 'carebox', isActive: true } }),
    
    // CareBand devices
    Device.count({ where: { userId: req.user.id, deviceType: 'careband', isActive: true } }),
    
    // Online devices
    Device.count({ where: { userId: req.user.id, connectionStatus: 'online', isActive: true } }),
    
    // Devices with low battery
    Device.count({ 
      where: { 
        userId: req.user.id, 
        batteryLevel: { [Op.lte]: 20 },
        isActive: true 
      } 
    }),
    
    // Devices needing maintenance (last sync > 7 days)
    Device.count({
      where: {
        userId: req.user.id,
        lastSync: { [Op.lte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        isActive: true
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalDevices: deviceStats[0],
      careboxDevices: deviceStats[1],
      carebandDevices: deviceStats[2],
      onlineDevices: deviceStats[3],
      lowBatteryDevices: deviceStats[4],
      maintenanceNeeded: deviceStats[5]
    }
  });
}));

// @desc    Sync device data
// @route   POST /api/devices/:id/sync
// @access  Private
router.post(
  '/:id/sync',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid device ID'),
    body('data').isObject().withMessage('Sync data must be an object'),
    body('data.adherenceRecords').optional().isArray().withMessage('Adherence records must be an array'),
    body('data.deviceStatus').optional().isObject().withMessage('Device status must be an object')
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

    const device = await Device.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const { data } = req.body;
    const results = {
      adherenceRecordsProcessed: 0,
      errors: []
    };

    // Process adherence records if provided
    if (data.adherenceRecords && Array.isArray(data.adherenceRecords)) {
      for (const record of data.adherenceRecords) {
        try {
          const adherenceRecord = await Adherence.create({
            ...record,
            userId: req.user.id,
            deviceId: device.id,
            syncStatus: 'synced',
            lastSyncTime: new Date()
          });
          results.adherenceRecordsProcessed++;
        } catch (error) {
          results.errors.push({
            record,
            error: error.message
          });
        }
      }
    }

    // Update device status if provided
    if (data.deviceStatus) {
      await device.update({
        ...data.deviceStatus,
        lastSync: new Date()
      });
    } else {
      await device.update({ lastSync: new Date() });
    }

    logger.info(`Device sync completed: ${device.name} - ${results.adherenceRecordsProcessed} records processed`);

    res.json({
      success: true,
      message: 'Device sync completed successfully',
      data: results
    });
  })
);

module.exports = router;