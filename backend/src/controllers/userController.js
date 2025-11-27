const { User } = require('../models');
const logger = require('../utils/logger');

class UserController {
  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] }
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
