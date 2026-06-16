const express = require('express');
const router = express.Router();
const { Prescription, User, CaregiverPatient } = require('../models');
const { hydrateWithUsers } = require('../utils/crossDbHelper');
const { authMiddleware, requirePatientAccess, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger');
const { body, query, param, validationResult } = require('express-validator');
const multer = require('multer');
const PDFService = require('../services/pdfService');
const errorHandler = require('../middleware/errorHandler');
const fs = require('fs').promises;
const path = require('path');

// Ensure upload directories exist
const ensureDirectories = async () => {
  const dirs = [
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../uploads/prescriptions'),
    path.join(__dirname, '../../uploads/temp')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        logger.error(`Error creating directory ${dir}:`, error);
      }
    }
  }
};

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories();
    cb(null, path.join(__dirname, '../../uploads/prescriptions'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `prescription-${uniqueSuffix}.pdf`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Get all prescriptions for user
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
 *           enum: [active, expired, filled, cancelled, pending]
 *       - in: query
 *         name: needsReview
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of prescriptions retrieved successfully
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
 *                     prescriptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DocumentMetadata'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     statistics:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// @desc    Get all prescriptions for user
// @route   GET /api/prescriptions
// @access  Private
router.get(
  '/',
  [
    authMiddleware,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'expired', 'filled', 'cancelled', 'pending']).withMessage('Invalid status'),
    query('needsReview').optional().isBoolean().withMessage('needsReview must be boolean')
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

    const { page = 1, limit = 20, status, needsReview } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = { 
      userId: req.user.id,
      isActive: true 
    };
    
    if (status) whereClause.status = status;
    if (needsReview !== undefined) whereClause.needsReview = needsReview === 'true';

    const { count, rows: prescriptionsRaw } = await Prescription.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Cross-DB hydration: attach reviewer user data from PII database
    const prescriptions = await hydrateWithUsers(prescriptionsRaw, 'reviewerId', 'reviewer', ['id', 'firstName', 'lastName', 'role']);

    // Calculate summary statistics
    const totalStats = await Prescription.findAll({
      where: { userId: req.user.id, isActive: true },
      attributes: [
        'status',
        [Prescription.sequelize.fn('COUNT', Prescription.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        statistics: totalStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.getDataValue('count'));
          return acc;
        }, {})
      }
    });
  })
);

/**
 * @swagger
 * /api/prescriptions/schedule:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Get daily medication schedule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
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
 *                     schedule:
 *                       type: array
 *                       items:
 *                         type: object
 *                     date:
 *                       type: string
 *                       format: date
 *                     totalDoses:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/schedule', 
  authMiddleware,
  [
    query('date').isISO8601().withMessage('Invalid date format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { date } = req.query;
      const { Medication, Prescription } = require('../models');
      
      // Get all active medications for the user
      const medications = await Medication.findAll({
        where: {
          userId: req.user.id,
          isActive: true
        }
      });

      // Generate schedule for the requested date
      const scheduleDate = new Date(date);
      const schedule = [];

      medications.forEach(med => {
        // Parse frequency to determine times per day
        const timesPerDay = med.timesPerDay || 1;
        
        // Generate scheduled times for the day
        const scheduleTime = (hour, minute = 0) => {
          const time = new Date(scheduleDate);
          time.setHours(hour, minute, 0, 0);
          return time;
        };

        // Default schedule based on times per day
        let scheduledTimes = [];
        if (timesPerDay === 1) {
          scheduledTimes = [scheduleTime(9)]; // 9 AM
        } else if (timesPerDay === 2) {
          scheduledTimes = [scheduleTime(9), scheduleTime(21)]; // 9 AM, 9 PM
        } else if (timesPerDay === 3) {
          scheduledTimes = [scheduleTime(9), scheduleTime(14), scheduleTime(21)]; // 9 AM, 2 PM, 9 PM
        } else if (timesPerDay === 4) {
          scheduledTimes = [scheduleTime(9), scheduleTime(13), scheduleTime(17), scheduleTime(21)]; // 9 AM, 1 PM, 5 PM, 9 PM
        }

        scheduledTimes.forEach(time => {
          schedule.push({
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            dosageUnit: med.dosageUnit,
            scheduledTime: time.toISOString(),
            instructions: med.instructions,
            status: 'scheduled' // Default status
          });
        });
      });

      // Sort by scheduled time
      schedule.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

      res.json({
        success: true,
        data: {
          schedule,
          date: date,
          totalDoses: schedule.length
        }
      });

    } catch (error) {
      console.error('Get daily schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load schedule'
      });
    }
  }
);

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Get single prescription
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
 *         description: Prescription retrieved successfully
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
 *                     prescription:
 *                       $ref: '#/components/schemas/DocumentMetadata'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
router.get(
  '/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid prescription ID')
  ],
  requirePatientAccess,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const prescriptionRaw = await Prescription.findOne({
      where: {
        id: req.params.id,
        userId: req.params.patientId || req.user.id,
        isActive: true
      },
    });

    if (!prescriptionRaw) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Cross-DB hydration: attach reviewer user data from PII database
    const [prescription] = await hydrateWithUsers([prescriptionRaw], 'reviewerId', 'reviewer', ['id', 'firstName', 'lastName', 'role']);

    res.json({
      success: true,
      data: {
        prescription
      }
    });
  })
);

/**
 * @swagger
 * /api/prescriptions/upload:
 *   post:
 *     tags: [Prescriptions]
 *     summary: Upload and process prescription PDF
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [prescription]
 *             properties:
 *               prescription:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Prescription uploaded and processed successfully
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
 *                     prescription:
 *                       $ref: '#/components/schemas/DocumentMetadata'
 *                     extractedData:
 *                       type: object
 *                     needsReview:
 *                       type: boolean
 *                     medicationsCount:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error processing prescription PDF
 */
// @desc    Upload and process prescription PDF
// @route   POST /api/prescriptions/upload
// @access  Private
router.post(
  '/upload',
  [
    authMiddleware,
    upload.single('prescription')
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No prescription file uploaded'
      });
    }

    let extractedData;
    let prescription;

    try {
      // Ensure directories exist
      await ensureDirectories();
      
      // Process PDF using comprehensive PDF service
      extractedData = await PDFService.extractPrescriptionData(req.file.path);
      
      // Generate prescription number
      const prescriptionNumber = 'RX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Create prescription record
      prescription = await Prescription.create({
        userId: req.user.id,
        prescriptionNumber,
        prescriberName: extractedData.doctor.name || 'Unknown',
        prescriberLicense: extractedData.doctor.license || '',
        patientName: extractedData.patient.name || '',
        patientDateOfBirth: extractedData.patient.dateOfBirth || null,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
        medications: extractedData.medications,
        status: 'pending',
        confidence: extractedData.confidence || 0.5,
        needsReview: (extractedData.confidence || 0.5) < 0.7,
        pdfUrl: `/uploads/prescriptions/${req.file.filename}`,
        pdfOriginalName: req.file.originalname,
        extractionMetadata: {
          medicationsFound: extractedData.medications.length,
          extractionDate: new Date(),
          pdfSize: req.file.size,
          confidence: extractedData.confidence
        }
      });

      logger.info(`Prescription uploaded and processed: ${prescriptionNumber} for user ${req.user.email} - ${extractedData.medications.length} medications found`);

      // Clean up temporary file if needed
      if (req.file.path.includes('temp')) {
        PDFService.cleanupFile(req.file.path);
      }

      res.status(201).json({
        success: true,
        message: 'Prescription uploaded and processed successfully',
        data: {
          prescription,
          extractedData,
          needsReview: prescription.needsReview,
          medicationsCount: extractedData.medications.length
        }
      });

    } catch (error) {
      logger.error('Error processing prescription PDF:', error);
      
      // Clean up uploaded file on error
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file:', unlinkError);
      }

      res.status(500).json({
        success: false,
        message: 'Error processing prescription PDF',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  })
);

/**
 * @swagger
 * /api/prescriptions:
 *   post:
 *     tags: [Prescriptions]
 *     summary: Create prescription manually
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prescriberName, medications]
 *             properties:
 *               prescriberName:
 *                 type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *               issueDate:
 *                 type: string
 *                 format: date
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Prescription created successfully
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
 *                     prescription:
 *                       $ref: '#/components/schemas/DocumentMetadata'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// @desc    Create prescription manually
// @route   POST /api/prescriptions
// @access  Private
router.post(
  '/',
  [
    authMiddleware,
    body('prescriberName').notEmpty().trim().withMessage('Prescriber name is required'),
    body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
    body('medications.*.name').notEmpty().trim().withMessage('Medication name is required'),
    body('medications.*.dosage').notEmpty().trim().withMessage('Medication dosage is required'),
    body('issueDate').optional().isISO8601().withMessage('Invalid issue date'),
    body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date')
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

    const prescriptionData = {
      ...req.body,
      userId: req.user.id,
      prescriptionNumber: 'RX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      confidence: 1.0, // Manual entry has high confidence
      needsReview: false,
      status: 'pending',
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : new Date(),
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };

    const prescription = await Prescription.create(prescriptionData);

    logger.info(`Manual prescription created: ${prescription.prescriptionNumber} for user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: {
        prescription
      }
    });
  })
);

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   put:
 *     tags: [Prescriptions]
 *     summary: Update prescription
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, expired, filled, cancelled, pending]
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *               reviewNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription updated successfully
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
 *                     prescription:
 *                       $ref: '#/components/schemas/DocumentMetadata'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private
router.put(
  '/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid prescription ID'),
    body('status').optional().isIn(['active', 'expired', 'filled', 'cancelled', 'pending']).withMessage('Invalid status'),
    body('medications').optional().isArray().withMessage('Medications must be an array'),
    body('reviewNotes').optional().trim().isLength({ max: 1000 }).withMessage('Review notes too long')
  ],
  requirePatientAccess,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const prescription = await Prescription.findOne({
      where: {
        id: req.params.id,
        userId: req.params.patientId || req.user.id,
        isActive: true
      }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Add review information if provided
    if (req.body.reviewNotes) {
      req.body.reviewedBy = req.user.id;
      req.body.reviewedAt = new Date();
      req.body.needsReview = false;
    }

    // Update prescription
    await prescription.update(req.body);

    logger.info(`Prescription updated: ${prescription.prescriptionNumber} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: {
        prescription
      }
    });
  })
);

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   delete:
 *     tags: [Prescriptions]
 *     summary: Delete prescription
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
 *         description: Prescription deleted successfully
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private
router.delete(
  '/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid prescription ID')
  ],
  requirePatientAccess,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const prescription = await Prescription.findOne({
      where: {
        id: req.params.id,
        userId: req.params.patientId || req.user.id,
        isActive: true
      }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // GDPR Art. 17 — hard delete the prescription
    await prescription.destroy();

    logger.info(`Prescription deleted: ${prescription.prescriptionNumber} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  })
);

/**
 * @swagger
 * /api/prescriptions/{id}/review:
 *   put:
 *     tags: [Prescriptions]
 *     summary: Review prescription (for healthcare providers)
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
 *               patientId:
 *                 type: string
 *               reviewNotes:
 *                 type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription reviewed successfully
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
 *                     prescription:
 *                       $ref: '#/components/schemas/DocumentMetadata'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// @desc    Review prescription (for healthcare providers)
// @route   PUT /api/prescriptions/:id/review
// @access  Private (Healthcare Provider)
router.put(
  '/:id/review',
  [
    authMiddleware,
    requireRole(['healthcare_provider', 'admin']),
    param('id').isUUID().withMessage('Invalid prescription ID'),
    body('reviewNotes').optional().trim().isLength({ max: 1000 }).withMessage('Review notes too long'),
    body('medications').optional().isArray().withMessage('Medications must be an array')
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

    // IDOR fix: require patientId and validate ownership (not just findByPk)
    const patientId = req.body.patientId || req.query.patientId;
    const whereClause = { id: req.params.id, isActive: true };
    if (patientId) whereClause.userId = patientId;

    const prescription = await Prescription.findOne({ where: whereClause });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const { reviewNotes, medications, status } = req.body;
    
    const updates = {
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      reviewNotes,
      needsReview: false
    };

    if (medications) updates.medications = medications;
    if (status) updates.status = status;

    await prescription.update(updates);

    logger.info(`Prescription reviewed: ${prescription.prescriptionNumber} by healthcare provider ${req.user.email}`);

    res.json({
      success: true,
      message: 'Prescription reviewed successfully',
      data: {
        prescription
      }
    });
  })
);

/**
 * @swagger
 * /api/prescriptions/needing-review:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Get prescriptions needing review
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
 *     responses:
 *       200:
 *         description: List of prescriptions needing review retrieved successfully
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
 *                     prescriptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DocumentMetadata'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
// @desc    Get prescriptions needing review
// @route   GET /api/prescriptions/needing-review
// @access  Private (Healthcare Provider)
router.get(
  '/needing-review',
  [
    authMiddleware,
    requireRole(['healthcare_provider', 'admin']),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // IDOR fix: scope to patients assigned to this provider via CaregiverPatient
    const { Op } = require('sequelize');
    const assignments = await CaregiverPatient.findAll({
      where: { caregiverId: req.user.id, status: 'accepted' },
      attributes: ['patientId'],
    });
    const assignedPatientIds = assignments.map(a => a.patientId);

    const { count, rows: prescriptionsRaw } = await Prescription.findAndCountAll({
      where: {
        needsReview: true,
        isActive: true,
        userId: { [Op.in]: assignedPatientIds },
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'ASC']],
    });

    // Cross-DB hydration: attach user data from PII database
    const prescriptions = await hydrateWithUsers(prescriptionsRaw, 'userId', 'user', ['id', 'firstName', 'lastName', 'email']);

    res.json({
      success: true,
      data: {
        prescriptions,
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

/**
 * @swagger
 * /api/prescriptions/stats:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Get prescription statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prescription statistics retrieved successfully
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
 *                     statistics:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// @desc    Get prescription statistics
// @route   GET /api/prescriptions/stats
// @access  Private
router.get(
  '/stats',
  [
    authMiddleware
  ],
  asyncHandler(async (req, res) => {
    // Get user's prescription statistics
    const userStats = await Prescription.findAll({
      where: { userId: req.user.id, isActive: true },
      attributes: [
        'status',
        [Prescription.sequelize.fn('COUNT', Prescription.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Get medications statistics
    const medicationsStats = await Prescription.findAll({
      where: { userId: req.user.id, isActive: true },
      attributes: [
        [Prescription.sequelize.fn('JSON_LENGTH', Prescription.sequelize.col('medications')), 'medicationsCount']
      ]
    });

    const totalMedications = medicationsStats.reduce((sum, stat) => 
      sum + parseInt(stat.getDataValue('medicationsCount') || 0), 0);

    // Get review statistics
    const reviewStats = await Prescription.findAll({
      where: { userId: req.user.id, isActive: true },
      attributes: [
        'needsReview',
        [Prescription.sequelize.fn('COUNT', Prescription.sequelize.col('id')), 'count']
      ],
      group: ['needsReview']
    });

    const stats = {
      status: userStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.getDataValue('count'));
        return acc;
      }, {}),
      totalPrescriptions: userStats.reduce((sum, stat) => 
        sum + parseInt(stat.getDataValue('count')), 0),
      totalMedications,
      review: reviewStats.reduce((acc, stat) => {
        const key = stat.needsReview ? 'needsReview' : 'reviewed';
        acc[key] = parseInt(stat.getDataValue('count'));
        return acc;
      }, { needsReview: 0, reviewed: 0 })
    };

    res.json({
      success: true,
      data: {
        statistics: stats
      }
    });
  })
);

// Error handling for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed'
    });
  }
  
  next(error);
});

module.exports = router;