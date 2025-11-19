import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/api';

class ThemeService {
  /**
   * Get stored theme preference
   * @returns {Promise<string>} Theme preference
   */
  async getTheme() {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      return theme || 'light';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light';
    }
  }

  /**
   * Set theme preference
   * @param {string} theme - Theme preference
   */
  async setTheme(theme) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }

  /**
   * Toggle between light and dark theme
   * @returns {Promise<string>} New theme preference
   */
  async toggleTheme() {
    try {
      const currentTheme = await this.getTheme();
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      await this.setTheme(newTheme);
      return newTheme;
    } catch (error) {
      console.error('Error toggling theme:', error);
      return 'light';
    }
  }

  /**
   * Get theme colors
   * @param {string} theme - Theme preference
   * @returns {Object} Theme colors
   */
  getThemeColors(theme = 'light') {
    const colors = {
      light: {
        primary: '#2196F3',
        primaryDark: '#1976D2',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        card: '#FFFFFF',
        text: '#212121',
        textSecondary: '#757575',
        textDisabled: '#BDBDBD',
        border: '#E0E0E0',
        divider: '#EEEEEE',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        statusBar: '#FFFFFF',
        header: '#2196F3',
        headerText: '#FFFFFF'
      },
      dark: {
        primary: '#64B5F6',
        primaryDark: '#42A5F5',
        background: '#121212',
        surface: '#1E1E1E',
        card: '#2D2D2D',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        textDisabled: '#6C6C6C',
        border: '#373737',
        divider: '#2D2D2D',
        success: '#66BB6A',
        warning: '#FFA726',
        error: '#EF5350',
        info: '#64B5F6',
        statusBar: '#121212',
        header: '#2D2D2D',
        headerText: '#FFFFFF'
      }
    };

    return colors[theme] || colors.light;
  }

  /**
   * Check if high contrast theme is enabled
   * @param {Object} userPreferences - User preferences
   * @returns {boolean} High contrast enabled
   */
  isHighContrast(userPreferences = {}) {
    return userPreferences.accessibility?.highContrast || false;
  }

  /**
   * Get large text setting
   * @param {Object} userPreferences - User preferences
   * @returns {boolean} Large text enabled
   */
  isLargeText(userPreferences = {}) {
    return userPreferences.accessibility?.largeText || false;
  }
}

export default new ThemeService();