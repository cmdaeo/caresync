const express = require('express');
const router = express.Router();
const { ConsentLog } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const VALID_CONSENT_TYPES = [
  'symptom_processing',
  'medication_tracking',
  'doctor_sharing',
  'caregiver_sharing',
  'analytics',
  'push_notifications',
  'email_notifications'
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

/**
 * @swagger
 * /api/consent:
 *   get:
 *     tags: [Consent]
 *     summary: Get current consent status for all types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current consent status
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    // For each consent type, find the most recent log entry to determine current status
    const consents = {};

    for (const type of VALID_CONSENT_TYPES) {
      const latest = await ConsentLog.findOne({
        where: { userId: req.user.id, consentType: type },
        order: [['createdAt', 'DESC']]
      });
      consents[type] = {
        granted: latest ? latest.action === 'grant' : false,
        lastUpdated: latest ? latest.createdAt : null
      };
    }

    res.json({ success: true, data: { consents } });
  })
);

/**
 * @swagger
 * /api/consent:
 *   post:
 *     tags: [Consent]
 *     summary: Grant or revoke a specific consent
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [consentType, action]
 *             properties:
 *               consentType:
 *                 type: string
 *                 enum: [symptom_processing, medication_tracking, doctor_sharing, caregiver_sharing, analytics, push_notifications, email_notifications]
 *               action:
 *                 type: string
 *                 enum: [grant, revoke]
 *     responses:
 *       201:
 *         description: Consent recorded
 */
router.post(
  '/',
  authMiddleware,
  [
    body('consentType')
      .isIn(VALID_CONSENT_TYPES)
      .withMessage(`consentType must be one of: ${VALID_CONSENT_TYPES.join(', ')}`),
    body('action')
      .isIn(['grant', 'revoke'])
      .withMessage('action must be grant or revoke')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { consentType, action } = req.body;

    const entry = await ConsentLog.create({
      userId: req.user.id,
      consentType,
      action,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { source: 'api', timestamp: new Date().toISOString() }
    });

    logger.info(`Consent ${action}ed: ${consentType} for user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: `Consent ${action === 'grant' ? 'granted' : 'revoked'} for ${consentType}`,
      data: {
        id: entry.id,
        consentType: entry.consentType,
        action: entry.action,
        createdAt: entry.createdAt
      }
    });
  })
);

/**
 * @swagger
 * /api/consent/history:
 *   get:
 *     tags: [Consent]
 *     summary: Get full consent audit trail for the user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consent history
 */
router.get(
  '/history',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const history = await ConsentLog.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'consentType', 'action', 'ipAddress', 'createdAt']
    });

    res.json({ success: true, data: { history } });
  })
);

module.exports = router;
