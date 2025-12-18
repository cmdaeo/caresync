const caregiverService = require('../services/caregiverService');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');

class CaregiverController {
    /**
   * Get pending invitations for the logged-in caregiver
   * Route: GET /pending
   */
  async getPendingInvitations(req, res) {
    try {
      const invitations = await caregiverService.getPendingInvitations(req.user);

      const response = ApiResponse.success(invitations);

      res.json(response);
    } catch (error) {
      logger.error('Get pending invitations error:', error);
      throw error;
    }
  }

  /**
   * Accept a caregiver invitation
   * Route: POST /:id/accept
   */
  async acceptInvitation(req, res) {
    try {
      const { id } = req.params;

      const relationship = await caregiverService.acceptInvitation(req.user, id);

      const response = ApiResponse.success(
        relationship,
        'Invitation accepted successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Accept invitation error:', error);
      throw error;
    }
  }

    async getPatients(req, res) {
    try {
      const patients = await caregiverService.getPatients(req.user);

      const response = ApiResponse.success(patients);

      res.json(response);

    } catch (error) {
      logger.error('Get patients error:', error);
      throw error;
    }
  }

  /**
   * Decline a caregiver invitation
   * Route: POST /:id/decline
   */
  async declineInvitation(req, res) {
    try {
      const { id } = req.params;

      await caregiverService.declineInvitation(req.user, id);

      const response = ApiResponse.success(
        null,
        'Invitation declined successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Decline invitation error:', error);
      throw error;
    }
  }
  /**
   * Get all caregivers for the current patient
   */
  async getCaregivers(req, res) {
    try {
      const caregivers = await caregiverService.getCaregivers(req.user);

      const response = ApiResponse.success({ caregivers });

      res.json(response);
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
    const invitationData = req.body;

    await caregiverService.inviteCaregiver(req.user, invitationData);

    const response = ApiResponse.success(
      null,
      'Invitation sent successfully',
      201
    );

    res.status(201).json(response);
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
      const { id } = req.params;

      await caregiverService.removeCaregiver(req.user, id);

      const response = ApiResponse.success(
        null,
        'Caregiver removed successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Remove caregiver error:', error);
      throw error;
    }
  }
}

module.exports = new CaregiverController();
