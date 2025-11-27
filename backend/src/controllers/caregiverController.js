const { User, CaregiverPatient } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class CaregiverController {
  /**
   * Get all caregivers for the current patient
   */
  async getCaregivers(req, res) {
    try {
      const relationships = await CaregiverPatient.findAll({
        where: { patientId: req.user.id, isActive: true },
        include: [{
          model: User,
          as: 'caregiver',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture']
        }]
      });

      // Flatten structure for frontend
      const caregivers = relationships.map(rel => ({
        ...rel.caregiver.toJSON(),
        relationshipId: rel.id,
        relationshipType: rel.relationship,
        permissions: rel.permissions,
        status: rel.isVerified ? 'Active' : 'Pending'
      }));

      res.json({
        success: true,
        data: { caregivers }
      });
    } catch (error) {
      logger.error('Get caregivers error:', error);
      throw error;
    }
  }

  /**
   * Invite a caregiver by email
   */
  async inviteCaregiver(req, res) {
    try {
      const { email, relationship, permissions } = req.body;

      // Find if user exists
      const caregiverUser = await User.findByEmail(email);
      if (!caregiverUser) {
        // In a real app, you would send an email invitation to join the platform here
        return res.status(404).json({
          success: false,
          message: 'User not found. Please ask them to register first.'
        });
      }

      if (caregiverUser.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot invite yourself.'
        });
      }

      // Check if already connected
      const existing = await CaregiverPatient.findOne({
        where: {
          caregiverId: caregiverUser.id,
          patientId: req.user.id,
          isActive: true
        }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Caregiver already connected.'
        });
      }

      // Create link
      await CaregiverPatient.create({
        caregiverId: caregiverUser.id,
        patientId: req.user.id,
        relationship: relationship || 'other',
        permissions: permissions || { view_medications: true },
        isVerified: false, // Needs acceptance
        isActive: true
      });

      logger.info(`Caregiver invited: ${email} by ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully'
      });
    } catch (error) {
      logger.error('Invite caregiver error:', error);
      throw error;
    }
  }

  /**
   * Remove a caregiver
   */
  async removeCaregiver(req, res) {
    try {
      const { id } = req.params; // Relationship ID or Caregiver ID
      
      // Try to find by relationship ID first
      let link = await CaregiverPatient.findByPk(id);
      
      // If not found, try by caregiver ID for current user
      if (!link) {
        link = await CaregiverPatient.findOne({
          where: { caregiverId: id, patientId: req.user.id }
        });
      }

      if (!link) {
        return res.status(404).json({ success: false, message: 'Relationship not found' });
      }

      await link.update({ isActive: false });
      
      res.json({ success: true, message: 'Caregiver removed successfully' });
    } catch (error) {
      logger.error('Remove caregiver error:', error);
      throw error;
    }
  }
}

module.exports = new CaregiverController();
