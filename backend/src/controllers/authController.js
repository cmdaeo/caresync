const authService = require('../services/authService');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const userData = req.body;
      const { user, token, refreshToken } = await authService.register(userData);

      // Set refresh token in HttpOnly, Secure, SameSite=Strict cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      const response = ApiResponse.success(
        {
          user: user.toJSON(),
          token // Access token sent in response body
        },
        'User registered successfully',
        201
      );

      res.status(201).json(response);
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // FIXED: Pass request context (IP and User Agent) to the service
      const { user, token, refreshToken } = await authService.login(email, password, {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Set refresh token in HttpOnly, Secure, SameSite=Strict cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      const response = ApiResponse.success(
        {
          user: user.toJSON(),
          token // Access token sent in response body
        },
        'Login successful'
      );

      res.json(response);
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const user = await authService.getProfile(req.user);

      const response = ApiResponse.success(
        {
          user
        }
      );

      res.json(response);
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const profileData = req.body;
      const user = await authService.updateProfile(req.user, profileData);

      const response = ApiResponse.success(
        {
          user: user.toJSON()
        },
        'Profile updated successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);

      const response = ApiResponse.success(
        null,
        'Password changed successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.cookies;
      const { token, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);

      // Set new refresh token in HttpOnly, Secure, SameSite=Strict cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      const response = ApiResponse.success(
        {
          token // New access token sent in response body
        }
      );

      res.json(response);
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      await authService.logout(req.user);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      const response = ApiResponse.success(
        null,
        'Logged out successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      await authService.deleteAccount(req.user, password);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      const response = ApiResponse.success(
        null,
        'Account deleted successfully'
      );

      res.json(response);
    } catch (error) {
      logger.error('Delete account error:', error);
      throw error;
    }
  }
}

module.exports = new AuthController();
