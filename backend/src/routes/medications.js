const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleValidationErrors } = require('../middleware/validationMiddleware');
const { body, query, param } = require('express-validator');

<<<<<<< HEAD
// Validation middleware
const validateMedicationCreation = [
  body('name').notEmpty().trim().withMessage('Medication name is required'),
  body('dosage').notEmpty().trim().withMessage('Dosage is required'),
  body('dosageUnit').isIn(['mg', 'ml', 'tablets', 'capsules', 'drops', 'units', 'puffs']).withMessage('Invalid dosage unit'),
  body('timesPerDay').isInt({ min: 1, max: 24 }).withMessage('Times per day must be between 1 and 24'),
  body('frequency').optional().isString().withMessage('Frequency must be a string'),
  // Keep backward compatibility: allow optional nested frequency.timesPerDay/times but don’t require them
  body('frequency.timesPerDay').optional().isInt({ min: 1, max: 24 }).withMessage('Times per day must be between 1 and 24'),
  body('frequency.times').optional().isArray().withMessage('Times must be an array'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('totalQuantity').isInt({ min: 1 }).withMessage('Total quantity must be a positive integer'),
  body('remainingQuantity').optional().isInt({ min: 0 }).withMessage('Remaining quantity must be non-negative')
=======
// --- VALIDATION RULES ---

const validateMedication = [
  body('name').trim().notEmpty().withMessage('Medication name is required'),
  body('dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('dosageUnit').trim().notEmpty().withMessage('Dosage unit is required'),
  body('frequency').optional().trim(),
  body('timesPerDay').optional().isInt({ min: 1 }),
  body('totalQuantity').optional().isInt({ min: 0 }),
  body('startDate').optional().isISO8601()
>>>>>>> upstream/main
];

const validateAdherenceRecord = [
  body('medicationId').isUUID().withMessage('Invalid medication ID'),
  body('status').isIn(['taken', 'skipped', 'missed', 'late', 'early']).withMessage('Invalid status'),
  body('takenAt').optional().isISO8601().withMessage('Invalid taken time'),
  body('scheduledTime').isISO8601().withMessage('Invalid scheduled time')
];

// ==========================================
// 1. SPECIFIC ROUTES (Must come first!)
// ==========================================

/**
 * @swagger
 * /api/medications/schedule:
 *   get:
 *     tags: [Medications]
 *     summary: Get calendar data for medications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calendar data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     calendar:
 *                       type: array
 *                       items:
 *                         type: object
 *                     dateRange:
 *                       type: object
 */
// Matches GET /api/medications/schedule
// (Moved to top so "schedule" isn't treated as an :id)
router.get('/schedule', authMiddleware, asyncHandler(medicationController.getCalendarData.bind(medicationController)));

/**
 * @swagger
 * /api/medications/adherence:
 *   post:
 *     tags: [Medications]
 *     summary: Record adherence
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicationId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [taken, skipped, missed, late, early]
 *               takenAt:
 *                 type: string
 *                 format: date-time
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Adherence recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
// Matches POST /api/medications/adherence
router.post('/adherence', authMiddleware, validateAdherenceRecord, handleValidationErrors, asyncHandler(medicationController.recordAdherence.bind(medicationController)));

/**
 * @swagger
 * /api/medications/adherence/stats:
 *   get:
 *     tags: [Medications]
 *     summary: Get adherence statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Adherence statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rate:
 *                       type: number
 *                     total:
 *                       type: number
 *                     taken:
 *                       type: number
 *                     missed:
 *                       type: number
 *                     skipped:
 *                       type: number
 *                     period:
 *                       type: string
 */
// Matches GET /api/medications/adherence/stats
router.get('/adherence/stats', authMiddleware, asyncHandler(medicationController.getAdherenceStats.bind(medicationController)));


// ==========================================
// 2. GENERIC / PARAMETER ROUTES (Must come last!)
// ==========================================

// Core Medication CRUD
/**
 * @swagger
 * /api/medications:
 *   get:
 *     tags: [Medications]
 *     summary: Get all medications with pagination and optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of medications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 */
router.get('/', authMiddleware, asyncHandler(medicationController.getMedications.bind(medicationController)));

/**
 * @swagger
 * /api/medications:
 *   post:
 *     tags: [Medications]
 *     summary: Create a new medication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               dosage:
 *                 type: string
 *               dosageUnit:
 *                 type: string
 *               frequency:
 *                 type: string
 *               timesPerDay:
 *                 type: integer
 *               totalQuantity:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Medication created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
router.post('/', authMiddleware, validateMedication, handleValidationErrors, asyncHandler(medicationController.createMedication.bind(medicationController)));

router.post(
  '/pem-scan',
  authMiddleware,
  body('qrData').notEmpty().withMessage('QR Data string is required'),
  handleValidationErrors,
  asyncHandler(medicationController.processPemScan.bind(medicationController))
);

// :id routes match ANYTHING, so keep them at the bottom
/**
 * @swagger
 * /api/medications/{id}:
 *   get:
 *     tags: [Medications]
 *     summary: Get a specific medication
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medication retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/:id', authMiddleware, asyncHandler(medicationController.getMedication.bind(medicationController)));

/**
 * @swagger
 * /api/medications/{id}:
 *   put:
 *     tags: [Medications]
 *     summary: Update a medication
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
 *               dosage:
 *                 type: string
 *               dosageUnit:
 *                 type: string
 *               frequency:
 *                 type: string
 *               timesPerDay:
 *                 type: integer
 *               totalQuantity:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Medication updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
router.put('/:id', authMiddleware, validateMedication, handleValidationErrors, asyncHandler(medicationController.updateMedication.bind(medicationController)));

/**
 * @swagger
 * /api/medications/{id}:
 *   delete:
 *     tags: [Medications]
 *     summary: Delete a medication
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
 *         description: Medication deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete('/:id', authMiddleware, asyncHandler(medicationController.deleteMedication.bind(medicationController)));

<<<<<<< HEAD
// @desc    Get medications needing refill
// @route   GET /api/medications/refill-needed
// @access  Private
router.get('/refill-needed', authMiddleware, handleValidationErrors, asyncHandler(medicationController.getRefillNeeded.bind(medicationController)));

// @desc    Get upcoming doses
// @route   GET /api/medications/upcoming-doses
// @access  Private
router.get('/upcoming-doses', authMiddleware, validateUpcomingDoses, handleValidationErrors, asyncHandler(medicationController.getUpcomingDoses.bind(medicationController)));

// @desc    Refill medication
// @route   POST /api/medications/:id/refill
// @access  Private
router.post('/:id/refill', authMiddleware, validateRefill, validatePatientAccess, handleValidationErrors, asyncHandler(medicationController.refillMedication.bind(medicationController)));

// @desc    Get medication statistics
// @route   GET /api/medications/stats
// @access  Private
router.get('/stats', authMiddleware, handleValidationErrors, asyncHandler(medicationController.getMedicationStats.bind(medicationController)));
// @desc    Generate medication schedule
// @route   GET /api/medications/schedule
// @access  Private
router.get('/schedule', authMiddleware, [
  query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date')
], handleValidationErrors, asyncHandler(medicationController.generateSchedule.bind(medicationController)));

=======
>>>>>>> upstream/main
module.exports = router;
