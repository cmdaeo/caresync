const express = require('express');
const router = express.Router();
const { Prescription, User } = require('../models');
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

    const { count, rows: prescriptions } = await Prescription.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'role']
      }]
    });

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

    const prescription = await Prescription.findOne({
      where: {
        id: req.params.id,
        userId: req.params.patientId || req.user.id,
        isActive: true
      },
      include: [{
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'role']
      }]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      data: {
        prescription
      }
    });
  })
);

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

    // Soft delete by setting isActive to false
    await prescription.update({ isActive: false });

    logger.info(`Prescription deleted: ${prescription.prescriptionNumber} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  })
);

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

    const prescription = await Prescription.findByPk(req.params.id);
    
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

    const { count, rows: prescriptions } = await Prescription.findAndCountAll({
      where: {
        needsReview: true,
        isActive: true
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'ASC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
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
        }
      }
    });
  })
);

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