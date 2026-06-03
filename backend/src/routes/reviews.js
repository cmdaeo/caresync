const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { asyncHandler } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');

const validateReview = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('role').notEmpty().trim().withMessage('Role is required'),
  body('type').isIn(['clinical', 'patient', 'caregiver']).withMessage('Invalid review type'),
  body('content').notEmpty().trim().withMessage('Content is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// Public endpoints for showcase
router.get('/', asyncHandler(reviewController.getReviews.bind(reviewController)));
router.post('/', validateReview, handleValidation, asyncHandler(reviewController.submitReview.bind(reviewController)));

module.exports = router;