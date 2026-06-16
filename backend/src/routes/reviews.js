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
/**
 * @swagger
 * /api/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews
 *     responses:
 *       200:
 *         description: List of reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 */
router.get('/', asyncHandler(reviewController.getReviews.bind(reviewController)));

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a new review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, role, type, content]
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [clinical, patient, caregiver]
 *               content:
 *                 type: string
 *               rating:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Review submitted successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', validateReview, handleValidation, asyncHandler(reviewController.submitReview.bind(reviewController)));

module.exports = router;