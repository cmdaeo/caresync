import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import ThemeService from '../../services/ThemeService';
import NotificationService from '../../services/NotificationService';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [theme, setTheme] = useState('light');
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      voiceAlerts: true
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load current theme
      const currentTheme = await ThemeService.getTheme();
      setTheme(currentTheme);

      // Load notification preferences
      const notificationPrefs = await NotificationService.getNotificationPreferences();
      setPreferences(prev => ({
        ...prev,
        notifications: notificationPrefs
      }));

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = async () => {
    try {
      const newTheme = await ThemeService.toggleTheme();
      setTheme(newTheme);
      
      Toast.show({
        type: 'success',
        text1: 'Theme Updated',
        text2: `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme applied`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not update theme',
      });
    }
  };

  const handleNotificationToggle = async (type, value) => {
    try {
      const newPreferences = {
        ...preferences,
        notifications: {
          ...preferences.notifications,
          [type]: value
        }
      };
      
      setPreferences(newPreferences);
      await NotificationService.updateNotificationPreferences(newPreferences.notifications);
      
      Toast.show({
        type: 'success',
        text1: 'Preferences Updated',
        text2: `${type} notifications ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not update notification preferences',
      });
    }
  };

  const handleAccessibilityToggle = async (type, value) => {
    try {
      const newPreferences = {
        ...preferences,
        accessibility: {
          ...preferences.accessibility,
          [type]: value
        }
      };
      
      setPreferences(newPreferences);
      
      Toast.show({
        type: 'success',
        text1: 'Accessibility Updated',
        text2: `${type === 'highContrast' ? 'High contrast' : type === 'largeText' ? 'Large text' : 'Voice alerts'} ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not update accessibility settings',
      });
    }
  };

  const handleTestNotification = async () => {
    try {
      await NotificationService.sendTestNotification();
      
      Toast.show({
        type: 'success',
        text1: 'Test Notification Sent',
        text2: 'Check your notifications',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not send test notification',
      });
    }
  };

  const renderSettingItem = (title, value, onToggle, description = null) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e0e0e0', true: '#2196F3' }}
        thumbColor={value ? '#ffffff' : '#f4f4f4'}
      />
    </View>
  );

  const renderNavigationItem = (title, subtitle, onPress) => (
    <TouchableOpacity style={styles.navigationItem} onPress={onPress}>
      <View style={styles.navigationInfo}>
        <Text style={styles.navigationTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.navigationSubtitle}>{subtitle}</Text>
        )}
      </View>
      <Text style={styles.navigationArrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Theme Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark Theme</Text>
                <Text style={styles.settingDescription}>
                  Switch to dark mode for better nighttime viewing
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={handleThemeToggle}
                trackColor={{ false: '#e0e0e0', true: '#2196F3' }}
                thumbColor={theme === 'dark' ? '#ffffff' : '#f4f4f4'}
              />
            </View>
          </View>
        </View>

        {/* Accessibility Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          
          <View style={styles.card}>
            {renderSettingItem(
              'High Contrast',
              preferences.accessibility.highContrast,
              (value) => handleAccessibilityToggle('highContrast', value),
              'Increase contrast for better visibility'
            )}
            
            {renderSettingItem(
              'Large Text',
              preferences.accessibility.largeText,
              (value) => handleAccessibilityToggle('largeText', value),
              'Increase text size throughout the app'
            )}
            
            {renderSettingItem(
              'Voice Alerts',
              preferences.accessibility.voiceAlerts,
              (value) => handleAccessibilityToggle('voiceAlerts', value),
              'Enable text-to-speech notifications'
            )}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.card}>
            {renderSettingItem(
              'Email Notifications',
              preferences.notifications.email,
              (value) => handleNotificationToggle('email', value),
              'Receive medication reminders via email'
            )}
            
            {renderSettingItem(
              'Push Notifications',
              preferences.notifications.push,
              (value) => handleNotificationToggle('push', value),
              'Receive push notifications on your device'
            )}
            
            {renderSettingItem(
              'SMS Notifications',
              preferences.notifications.sms,
              (value) => handleNotificationToggle('sms', value),
              'Receive medication reminders via SMS'
            )}
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
            >
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Security</Text>
          
          <View style={styles.card}>
            {renderNavigationItem(
              'Profile Settings',
              'Update your personal information',
              () => navigation.navigate('Profile')
            )}
            
            {renderNavigationItem(
              'Privacy Settings',
              'Manage your data and privacy preferences',
              () => {}
            )}
            
            {renderNavigationItem(
              'Data & Sync',
              'Backup and sync your medication data',
              () => {}
            )}
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.card}>
            {renderNavigationItem(
              'Help & Documentation',
              'Get help using CareSync',
              () => {}
            )}
            
            {renderNavigationItem(
              'Contact Support',
              'Get in touch with our support team',
              () => {}
            )}
            
            {renderNavigationItem(
              'Privacy Policy',
              'Read our privacy policy',
              () => {}
            )}
            
            {renderNavigationItem(
              'Terms of Service',
              'Read our terms of service',
              () => {}
            )}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.aboutInfo}>
              <Text style={styles.appName}>CareSync</Text>
              <Text style={styles.version}>Version 1.0.0</Text>
              <Text style={styles.aboutText}>
                Your personal medication management companion
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navigationInfo: {
    flex: 1,
    marginRight: 12,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  navigationSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  navigationArrow: {
    fontSize: 24,
    color: '#999999',
  },
  testButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default SettingsScreen;