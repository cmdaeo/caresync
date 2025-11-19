const express = require('express');
const router = express.Router();
const adherenceController = require('../controllers/adherenceController');
const { authMiddleware, requirePatientAccess } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler')
const { body, query, param, validationResult } = require('express-validator');

// Validation middleware
const validateAdherenceRecord = [
  body('medicationId').isUUID().withMessage('Invalid medication ID'),
  body('scheduledTime').isISO8601().withMessage('Invalid scheduled time'),
  body('takenTime').optional().isISO8601().withMessage('Invalid taken time'),
  body('status').isIn(['taken', 'missed', 'delayed', 'skipped']).withMessage('Invalid status'),
  body('dosageTaken').optional().trim().isLength({ max: 50 }).withMessage('Dosage taken too long'),
  body('confirmationMethod').optional().isIn(['manual', 'automated', 'device', 'nfc', 'caregiver']).withMessage('Invalid confirmation method'),
  body('deviceId').optional().isUUID().withMessage('Invalid device ID'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
  body('sideEffects').optional().trim().isLength({ max: 500 }).withMessage('Side effects too long')
];

const validateAdherenceUpdate = [
  param('id').isUUID().withMessage('Invalid adherence ID'),
  body('status').optional().isIn(['scheduled', 'taken', 'missed', 'delayed', 'skipped']).withMessage('Invalid status'),
  body('takenTime').optional().isISO8601().withMessage('Invalid taken time'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
];

const validateBulkAdherence = [
  body('adherenceRecords').isArray({ min: 1 }).withMessage('Adherence records array is required'),
  body('adherenceRecords.*.medicationId').isUUID().withMessage('Invalid medication ID'),
  body('adherenceRecords.*.scheduledTime').isISO8601().withMessage('Invalid scheduled time'),
  body('adherenceRecords.*.status').isIn(['scheduled', 'taken', 'missed', 'delayed', 'skipped']).withMessage('Invalid status')
];

const validateAdherenceId = [
  param('id').isUUID().withMessage('Invalid adherence ID')
];

const validateAdherenceQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['scheduled', 'taken', 'missed', 'delayed', 'skipped']).withMessage('Invalid status'),
  query('medicationId').optional().isUUID().withMessage('Invalid medication ID'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid start date'),
  query('dateTo').optional().isISO8601().withMessage('Invalid end date')
];

const validateStatsQuery = [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Invalid period'),
  query('medicationId').optional().isUUID().withMessage('Invalid medication ID')
];

const validateTrendsQuery = [
  query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24'),
  query('medicationId').optional().isUUID().withMessage('Invalid medication ID')
];

// Validation handler
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

// Routes

// @desc    Get adherence records for user
// @route   GET /api/adherence
// @access  Private
router.get('/', authMiddleware, validateAdherenceQuery, handleValidationErrors, asyncHandler(adherenceController.getAdherenceRecords.bind(adherenceController)));

// @desc    Get single adherence record
// @route   GET /api/adherence/:id
// @access  Private
router.get('/:id', authMiddleware, validateAdherenceId, handleValidationErrors, asyncHandler(adherenceController.getAdherenceRecord.bind(adherenceController)));

// @desc    Record medication taken
// @route   POST /api/adherence
// @access  Private
router.post('/', authMiddleware, validateAdherenceRecord, handleValidationErrors, asyncHandler(adherenceController.recordAdherence.bind(adherenceController)));

// @desc    Update adherence record
// @route   PUT /api/adherence/:id
// @access  Private
router.put('/:id', authMiddleware, validateAdherenceUpdate, handleValidationErrors, asyncHandler(adherenceController.updateAdherenceRecord.bind(adherenceController)));

// @desc    Get adherence statistics
// @route   GET /api/adherence/stats
// @access  Private
router.get('/stats', authMiddleware, validateStatsQuery, handleValidationErrors, asyncHandler(adherenceController.getAdherenceStats.bind(adherenceController)));

// @desc    Get adherence trends over time
// @route   GET /api/adherence/trends
// @access  Private
router.get('/trends', authMiddleware, validateTrendsQuery, handleValidationErrors, asyncHandler(adherenceController.getAdherenceTrends.bind(adherenceController)));

// @desc    Get medication-specific adherence for a medication
// @route   GET /api/adherence/medication/:medicationId
// @access  Private
router.get('/medication/:medicationId', authMiddleware, [validateAdherenceId[0], ...validateStatsQuery], handleValidationErrors, asyncHandler(adherenceController.getMedicationAdherence.bind(adherenceController)));

// @desc    Record bulk adherence from device sync
// @route   POST /api/adherence/bulk
// @access  Private
router.post('/bulk', authMiddleware, validateBulkAdherence, handleValidationErrors, asyncHandler(adherenceController.bulkRecordAdherence.bind(adherenceController)));

module.exports = router;