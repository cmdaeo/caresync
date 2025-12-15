const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { query, param, validationResult } = require('express-validator');

// Validation middleware
const validateCalendarQuery = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('patientId').optional().isUUID().withMessage('Invalid patient ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateMedicationId = [
  param('medicationId').isUUID().withMessage('Invalid medication ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// @desc    Get calendar view data for medication adherence
// @route   GET /api/calendar
// @access  Private
router.get(['/', '/calendar', ''],
  authMiddleware,
  validateCalendarQuery,
  asyncHandler(calendarController.getCalendarData.bind(calendarController))
);

// @desc    Get calendar data for a specific medication
// @route   GET /api/calendar/medication/:medicationId
// @access  Private
router.get('/medication/:medicationId',
  authMiddleware,
  validateMedicationId,
  validateCalendarQuery,
  asyncHandler(calendarController.getMedicationCalendarData.bind(calendarController))
);

module.exports = router;