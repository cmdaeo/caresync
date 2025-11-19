const express = require('express');
const router = express.Router();
const { CaregiverPatient, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler')
const logger = require('../utils/logger');
const { body, query, param, validationResult } = require('express-validator');
const crypto = require('crypto');

// @desc    Get caregiver relationships for current user
// @route   GET /api/caregivers/relationships
// @access  Private
router.get(
  '/relationships',
  authMiddleware,
  asyncHandler(async (req, res) => {
    let relationships;
    
    if (req.user.role === 'caregiver' || req.user.role === 'healthcare_provider') {
      // Get relationships where user is the caregiver
      relationships = await CaregiverPatient.findAll({
        where: { 
          caregiverId: req.user.id,
          isActive: true
        },
        include: [{
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture', 'role', 'createdAt']
        }],
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Get relationships where user is the patient
      relationships = await CaregiverPatient.findAll({
        where: { 
          patientId: req.user.id,
          isActive: true
        },
        include: [{
          model: User,
          as: 'caregiver',
          attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture', 'role', 'createdAt']
        }],
        order: [['createdAt', 'DESC']]
      });
    }

    res.json({
      success: true,
      data: {
        relationships,
        count: relationships.length
      }
    });
  })
);

// @desc    Send caregiver invitation
// @route   POST /api/caregivers/invite
// @access  Private
router.post(
  '/invite',
  [
    authMiddleware,
    body('caregiverEmail').isEmail().normalizeEmail().withMessage('Valid caregiver email is required'),
    body('relationship').isIn([
      'family_member', 'spouse', 'parent', 'child', 'sibling', 'friend', 
      'professional_caregiver', 'home_care_aide', 'nurse', 'healthcare_provider', 'other'
    ]).withMessage('Invalid relationship type'),
    body('permissions').optional().isObject().withMessage('Permissions must be an object'),
    body('notificationSettings').optional().isObject().withMessage('Notification settings must be an object')
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

    const { caregiverEmail, relationship: relationshipType, permissions, notificationSettings } = req.body;

    // Check if caregiver already exists
    const caregiver = await User.findOne({ where: { email: caregiverEmail } });
    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found. Please ask them to create an account first.'
      });
    }

    if (caregiver.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot invite yourself as a caregiver'
      });
    }

    // Check if relationship already exists
    const existingRelationship = await CaregiverPatient.findOne({
      where: {
        caregiverId: caregiver.id,
        patientId: req.user.id,
        isActive: true
      }
    });

    if (existingRelationship) {
      return res.status(400).json({
        success: false,
        message: 'This caregiver already has access to your medications'
      });
    }

    // Generate verification code
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create relationship
    const relationship = await CaregiverPatient.create({
      caregiverId: caregiver.id,
      patientId: req.user.id,
      relationship: relationshipType,
      permissions: permissions || {},
      notificationSettings: notificationSettings || {},
      verificationCode,
      verificationExpires
    });

    // TODO: Send invitation email to caregiver
    // This would typically send an email with the verification link/code

    logger.info(`Caregiver invitation sent: ${caregiver.email} invited by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Caregiver invitation sent successfully',
      data: {
        relationship: {
          id: relationship.id,
          caregiver: {
            id: caregiver.id,
            firstName: caregiver.firstName,
            lastName: caregiver.lastName,
            email: caregiver.email
          },
          relationship: relationship.relationship,
          verificationCode: verificationCode, // In production, this should not be returned
          verificationExpires: verificationExpires
        }
      }
    });
  })
);

// @desc    Accept caregiver invitation
// @route   POST /api/caregivers/accept
// @access  Private
router.post(
  '/accept',
  [
    authMiddleware,
    body('patientId').isUUID().withMessage('Invalid patient ID'),
    body('verificationCode').notEmpty().trim().withMessage('Verification code is required')
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

    const { patientId, verificationCode } = req.body;

    // Find the relationship
    const relationship = await CaregiverPatient.findOne({
      where: {
        caregiverId: req.user.id,
        patientId: patientId,
        verificationCode: verificationCode,
        isActive: false,
        verificationExpires: { [require('sequelize').Op.gte]: new Date() }
      },
      include: [{
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Accept the invitation
    await relationship.update({
      isVerified: true,
      isActive: true,
      verificationCode: null,
      verificationExpires: null
    });

    logger.info(`Caregiver invitation accepted: ${req.user.email} accepted invitation for ${relationship.patient.email}`);

    res.json({
      success: true,
      message: 'Caregiver invitation accepted successfully',
      data: {
        relationship
      }
    });
  })
);

// @desc    Update caregiver permissions
// @route   PUT /api/caregivers/relationships/:id
// @access  Private
router.put(
  '/relationships/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid relationship ID'),
    body('permissions').optional().isObject().withMessage('Permissions must be an object'),
    body('notificationSettings').optional().isObject().withMessage('Notification settings must be an object'),
    body('accessLevel').optional().isIn(['read_only', 'partial_access', 'full_access']).withMessage('Invalid access level'),
    body('monitoringFrequency').optional().isIn(['real_time', 'hourly', 'daily', 'weekly']).withMessage('Invalid monitoring frequency')
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

    const relationship = await CaregiverPatient.findOne({
      where: {
        id: req.params.id,
        patientId: req.user.id,
        isActive: true
      },
      include: [{
        model: User,
        as: 'caregiver',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver relationship not found'
      });
    }

    // Update relationship
    const { permissions, notificationSettings, accessLevel, monitoringFrequency } = req.body;
    
    const updates = {};
    if (permissions) updates.permissions = { ...relationship.permissions, ...permissions };
    if (notificationSettings) updates.notificationSettings = { ...relationship.notificationSettings, ...notificationSettings };
    if (accessLevel) updates.accessLevel = accessLevel;
    if (monitoringFrequency) updates.monitoringFrequency = monitoringFrequency;

    await relationship.update(updates);

    logger.info(`Caregiver permissions updated: ${relationship.caregiver.email} for patient ${req.user.email}`);

    res.json({
      success: true,
      message: 'Caregiver permissions updated successfully',
      data: {
        relationship
      }
    });
  })
);

// @desc    Remove caregiver relationship
// @route   DELETE /api/caregivers/relationships/:id
// @access  Private
router.delete(
  '/relationships/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid relationship ID')
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

    const relationship = await CaregiverPatient.findOne({
      where: {
        id: req.params.id,
        [require('sequelize').Op.or]: [
          { caregiverId: req.user.id },
          { patientId: req.user.id }
        ],
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'caregiver',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver relationship not found'
      });
    }

    // Soft delete
    await relationship.update({ isActive: false });

    const removedUser = relationship.caregiverId === req.user.id ? 
      relationship.caregiver : relationship.patient;

    logger.info(`Caregiver relationship removed: ${removedUser.email} removed by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Caregiver relationship removed successfully'
    });
  })
);

// @desc    Get caregiver statistics
// @route   GET /api/caregivers/stats
// @access  Private
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const { Sequelize } = require('sequelize');
  const Op = Sequelize.Op;

  let stats = {};

  if (req.user.role === 'caregiver' || req.user.role === 'healthcare_provider') {
    // Caregiver statistics
    const relationships = await CaregiverPatient.findAndCountAll({
      where: { caregiverId: req.user.id, isActive: true }
    });

    const emergencyContacts = await CaregiverPatient.count({
      where: { 
        caregiverId: req.user.id, 
        isActive: true, 
        emergencyContact: true 
      }
    });

    stats = {
      totalPatients: relationships.count,
      emergencyContacts,
      verificationPending: 0 // This would need a separate field for pending invitations
    };
  } else {
    // Patient statistics
    const relationships = await CaregiverPatient.findAndCountAll({
      where: { patientId: req.user.id, isActive: true }
    });

    const verifiedCaregivers = await CaregiverPatient.count({
      where: { 
        patientId: req.user.id, 
        isActive: true, 
        isVerified: true 
      }
    });

    const emergencyContacts = await CaregiverPatient.count({
      where: { 
        patientId: req.user.id, 
        isActive: true, 
        emergencyContact: true 
      }
    });

    stats = {
      totalCaregivers: relationships.count,
      verifiedCaregivers,
      emergencyContacts,
      pendingInvitations: 0 // This would need a separate field for pending invitations
    };
  }

  res.json({
    success: true,
    data: {
      stats
    }
  });
}));

// @desc    Set emergency contact
// @route   PUT /api/caregivers/emergency/:id
// @access  Private
router.put(
  '/emergency/:id',
  [
    authMiddleware,
    param('id').isUUID().withMessage('Invalid relationship ID'),
    body('emergencyContact').isBoolean().withMessage('Emergency contact must be a boolean')
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

    const { emergencyContact } = req.body;

    const relationship = await CaregiverPatient.findOne({
      where: {
        id: req.params.id,
        patientId: req.user.id,
        isActive: true
      },
      include: [{
        model: User,
        as: 'caregiver',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver relationship not found'
      });
    }

    // If setting as emergency contact, remove emergency contact status from others
    if (emergencyContact) {
      await CaregiverPatient.update(
        { emergencyContact: false },
        {
          where: {
            patientId: req.user.id,
            isActive: true,
            emergencyContact: true
          }
        }
      );
    }

    await relationship.update({ emergencyContact });

    const action = emergencyContact ? 'set as emergency contact' : 'removed from emergency contacts';
    logger.info(`Emergency contact ${action}: ${relationship.caregiver.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: `Caregiver ${action} successfully`,
      data: {
        relationship
      }
    });
  })
);

module.exports = router;