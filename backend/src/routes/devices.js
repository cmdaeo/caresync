const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { body, param, validationResult } = require('express-validator');

// Validation middleware for deviceId and name
const validateDeviceId = [
  body('deviceId').notEmpty().withMessage('Device ID is required')
];

const validateDeviceName = [
  body('name').notEmpty().withMessage('Device name is required')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /api/devices:
 *   get:
 *     tags: [Devices]
 *     summary: Retrieve all devices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     devices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Device'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', deviceController.getDevices);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     tags: [Devices]
 *     summary: Register a new device
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               name:
 *                 type: string
 *               deviceType:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Device registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     device:
 *                       $ref: '#/components/schemas/Device'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', validateDeviceId, validateDeviceName, handleValidationErrors, deviceController.registerDevice);

/**
 * @swagger
 * /api/devices/register-with-signature:
 *   post:
 *     tags: [Devices]
 *     summary: Register a new device using signature-based authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               devicePublicKey:
 *                 type: string
 *               signature:
 *                 type: string
 *               name:
 *                 type: string
 *               deviceType:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device registered successfully with signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Device registered successfully with signature"
 *                 data:
 *                   type: object
 *                   properties:
 *                     device:
 *                       $ref: '#/components/schemas/Device'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/register-with-signature', validateDeviceId, validateDeviceName, handleValidationErrors, deviceController.registerDeviceWithSignature);

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Get single device details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     device:
 *                       $ref: '#/components/schemas/Device'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', deviceController.getDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     tags: [Devices]
 *     summary: Update device settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               deviceType:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Device updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     device:
 *                       $ref: '#/components/schemas/Device'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', deviceController.updateDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     tags: [Devices]
 *     summary: Remove device (Soft Delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Device removed successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', deviceController.deleteDevice);

/**
 * @swagger
 * /api/devices/{deviceId}/sync:
 *   post:
 *     tags: [Devices]
 *     summary: Sync device status (Webhook/Ping endpoint)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batteryLevel:
 *                 type: number
 *               connectionStatus:
 *                 type: string
 *               status:
 *                 type: object
 *     responses:
 *       200:
 *         description: Device synced
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Device synced"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:deviceId/sync', deviceController.syncStatus);

// Caregiver management routes
/**
 * @swagger
 * /api/devices/{deviceId}/invite-caregiver:
 *   post:
 *     tags: [Devices]
 *     summary: Invite a caregiver to access a device
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               accessLevel:
 *                 type: string
 *                 enum: [read_only, full_access]
 *     responses:
 *       201:
 *         description: Caregiver invitation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Caregiver invitation created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     invitation:
 *                       $ref: '#/components/schemas/DeviceInvitation'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:deviceId/invite-caregiver', deviceController.inviteCaregiver);

/**
 * @swagger
 * /api/devices/{deviceId}/caregivers/{invitationId}/accept:
 *   post:
 *     tags: [Devices]
 *     summary: Accept a caregiver invitation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caregiver invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Caregiver invitation accepted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     permission:
 *                       $ref: '#/components/schemas/DeviceAccessPermission'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:deviceId/caregivers/:invitationId/accept', deviceController.acceptCaregiverInvitation);

/**
 * @swagger
 * /api/devices/{deviceId}/caregivers:
 *   get:
 *     tags: [Devices]
 *     summary: Get all caregivers for a device
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of caregivers for the device
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     caregivers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeviceAccessPermission'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:deviceId/caregivers', deviceController.getDeviceCaregivers);

/**
 * @swagger
 * /api/devices/{deviceId}/caregivers/{caregiverId}:
 *   delete:
 *     tags: [Devices]
 *     summary: Remove caregiver access from a device
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: caregiverId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caregiver access removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Caregiver access removed successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:deviceId/caregivers/:caregiverId', deviceController.removeCaregiver);

module.exports = router;
