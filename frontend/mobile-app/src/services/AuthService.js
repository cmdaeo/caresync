import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

class AuthService {
  constructor() {
    this.TOKEN_KEY = '@caresync:token';
    this.REFRESH_TOKEN_KEY = '@caresync:refresh_token';
    this.USER_KEY = '@caresync:user';
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = await this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              await this.setAuthToken(response.token);
              await this.setRefreshToken(response.refreshToken);
              
              originalRequest.headers.Authorization = `Bearer ${response.token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            await this.clearAuth();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    try {
      const response = await this.api.post('/api/auth/register', userData);
      const { user, token, refreshToken } = response.data.data;
      
      // Store auth data
      await this.setAuthToken(token);
      await this.setRefreshToken(refreshToken);
      await this.setCurrentUser(user);
      
      return { user, token, refreshToken };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise<Object>} Login response
   */
  async login(credentials) {
    try {
      const response = await this.api.post('/api/auth/login', credentials);
      const { user, token, refreshToken } = response.data.data;
      
      // Store auth data
      await this.setAuthToken(token);
      await this.setRefreshToken(refreshToken);
      await this.setCurrentUser(user);
      
      return { user, token, refreshToken };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.api.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
    } finally {
      await this.clearAuth();
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  async getCurrentUser() {
    try {
      const response = await this.api.get('/api/auth/me');
      return response.data.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/api/auth/profile', profileData);
      const user = response.data.data.user;
      
      // Update stored user data
      await this.setCurrentUser(user);
      
      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Change password
   * @param {Object} passwordData - Current and new password
   */
  async changePassword(passwordData) {
    try {
      await this.api.put('/api/auth/password', passwordData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   */
  async requestPasswordReset(email) {
    try {
      await this.api.post('/api/auth/forgot-password', { email });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   * @param {Object} resetData - Reset token and new password
   */
  async resetPassword(resetData) {
    try {
      await this.api.post('/api/auth/reset-password', resetData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh authentication token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      const response = await this.api.post('/api/auth/refresh', { refreshToken });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;
      
      // Verify token by making a simple API call
      await this.api.get('/api/auth/me');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get stored authentication token
   * @returns {Promise<string|null>} Auth token
   */
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   * @returns {Promise<string|null>} Refresh token
   */
  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   * @returns {Promise<Object|null>} User data
   */
  async getStoredUser() {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  /**
   * Set authentication token
   * @param {string} token - Auth token
   */
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  /**
   * Set refresh token
   * @param {string} refreshToken - Refresh token
   */
  async setRefreshToken(refreshToken) {
    try {
      await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  /**
   * Set current user data
   * @param {Object} user - User data
   */
  async setCurrentUser(user) {
    try {
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAuth() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.TOKEN_KEY),
        AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(this.USER_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Handle API errors and provide user-friendly messages
   * @param {Error} error - API error
   * @returns {Error} Processed error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid request data');
        case 401:
          return new Error(data.message || 'Authentication failed');
        case 403:
          return new Error(data.message || 'Access denied');
        case 404:
          return new Error(data.message || 'Resource not found');
        case 422:
          return new Error(data.message || 'Validation failed');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(data.message || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other errors
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Get API instance for other services to use
   * @returns {Object} Axios instance with auth
   */
  getApi() {
    return this.api;
  }
}

export default new AuthService();