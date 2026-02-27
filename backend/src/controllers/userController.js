const { User, CaregiverPatient } = require('../models');
const logger = require('../utils/logger');

class UserController {
  /**
   * Get user by ID
   * Access control:
   *  - Users can always read their own profile
   *  - Admins can read any profile
   *  - Caregivers can read profiles of patients they are linked to (verified in DB)
   *  - All other access is denied (IDOR prevention)
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterRole = req.user.role;

      // Self-access is always allowed
      if (requesterId !== id && requesterRole !== 'admin') {
        // Check if requester is a verified caregiver for this patient
        const link = await CaregiverPatient.findOne({
          where: {
            caregiverId: requesterId,
            patientId: id,
            isVerified: true,
            isActive: true
          }
        });

        if (!link) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: [
          'password',
          'refreshTokenHash',
          'emailVerificationToken',
          'passwordResetToken',
          'passwordResetExpires',
          'tokenVersion'
        ] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ isActive });

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      logger.error('Update user status error:', error);
      throw error;
    }
  }
}

module.exports = new UserController();
