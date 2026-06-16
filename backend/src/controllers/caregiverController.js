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

  /**
   * Invite a patient by email
   */
  async invitePatient(req, res) {
    try {
      const invitationData = req.body;
      await caregiverService.invitePatient(req.user, invitationData);
      res.status(201).json(ApiResponse.success(null, 'Invitation sent successfully', 201));
    } catch (error) {
      logger.error('Invite patient error:', error);
      throw error;
    }
  }

  /**
   * Get pending invitations for the logged-in patient
   */
  async getPatientPendingInvitations(req, res) {
    try {
      const invitations = await caregiverService.getPatientPendingInvitations(req.user);
      res.json(ApiResponse.success(invitations));
    } catch (error) {
      logger.error('Get patient pending invitations error:', error);
      throw error;
    }
  }

  /**
   * Accept a patient invitation
   */
  async acceptPatientInvitation(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const relationship = await caregiverService.acceptPatientInvitation(req.user, id, permissions);
      res.json(ApiResponse.success(relationship, 'Invitation accepted successfully'));
    } catch (error) {
      logger.error('Accept patient invitation error:', error);
      throw error;
    }
  }

  /**
   * Decline a patient invitation
   */
  async declinePatientInvitation(req, res) {
    try {
      const { id } = req.params;
      await caregiverService.declinePatientInvitation(req.user, id);
      res.json(ApiResponse.success(null, 'Invitation declined successfully'));
    } catch (error) {
      logger.error('Decline patient invitation error:', error);
      throw error;
    }
  }

  /**
   * Update permissions for a caregiver relationship
   */
  async updatePermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const relationship = await caregiverService.updatePermissions(req.user, id, permissions);
      res.json(ApiResponse.success(relationship, 'Permissions updated successfully'));
    } catch (error) {
      logger.error('Update permissions error:', error);
      throw error;
    }
  }
}

module.exports = new CaregiverController();
