// controllers/authController.js
const authService = require('../services/authService');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');

class AuthController {
  async register(req, res) {
    try {
      const userData = req.body;
      const { user, token, refreshToken } = await authService.register(userData);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.status(201).json(ApiResponse.success({ user: user.toJSON(), token }, 'User registered successfully', 201));
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const { user, token, refreshToken } = await authService.login(email, password, {
        ip: req.ip, userAgent: req.headers['user-agent']
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json(ApiResponse.success({ user: user.toJSON(), token }, 'Login successful'));
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getProfile(req.user);
      res.json(ApiResponse.success({ user }));
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await authService.updateProfile(req.user, req.body);
      res.json(ApiResponse.success({ user: user.toJSON() }, 'Profile updated successfully'));
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      res.json(ApiResponse.success(null, 'Password changed successfully'));
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.cookies;
      const { token, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json(ApiResponse.success({ token }));
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  async logout(req, res) {
    try {
      await authService.logout(req.user);
      res.clearCookie('refreshToken', {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict'
      });
      res.json(ApiResponse.success(null, 'Logged out successfully'));
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      await authService.deleteAccount(req.user, password);
      res.clearCookie('refreshToken', {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict'
      });
      res.json(ApiResponse.success(null, 'Account deleted successfully'));
    } catch (error) {
      logger.error('Delete account error:', error);
      throw error;
    }
  }

  /**
   * Forgot Password — no auth required
   * Always returns 200 regardless of whether the email exists.
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);

      // Always return the same message — never reveal if the email exists
      res.json(ApiResponse.success(
        null,
        'If that email is registered, you will receive a reset link shortly.'
      ));
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset Password — no auth required (uses the token from the email link)
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);

      res.json(ApiResponse.success(null, 'Password has been reset successfully. Please sign in.'));
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

    /**
   * Change User Role
   */
  async changeRole(req, res) {
    try {
      const { newRole, currentPassword } = req.body;
      await authService.changeRole(req.user.id, newRole, currentPassword);

      // Clear refresh token cookie to force them to log in as their new role
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json(ApiResponse.success(
        null, 
        `Role changed to ${newRole}. All previous data was wiped. Please sign in again.`
      ));
    } catch (error) {
      logger.error('Change role error:', error);
      throw error;
    }
  }
}

module.exports = new AuthController();
