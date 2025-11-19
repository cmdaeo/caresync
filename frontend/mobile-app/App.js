import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Main app screens
import HomeScreen from './src/screens/home/HomeScreen';
import MedicationsScreen from './src/screens/medications/MedicationsScreen';
import AdherenceScreen from './src/screens/adherence/AdherenceScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';

// Services
import AuthService from './src/services/AuthService';
import NotificationService from './src/services/NotificationService';
import SocketService from './src/services/SocketService';
import ThemeService from './src/services/ThemeService';

// Theme
import { lightTheme, darkTheme } from './src/theme/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Log warnings that we don't want to show
LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    initializeApp();
    
    // Cleanup on app unmount
    return () => {
      SocketService.cleanup();
      NotificationService.cleanup();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user is already authenticated
      const authToken = await AuthService.getAuthToken();
      const currentUser = await AuthService.getStoredUser();
      const userTheme = await ThemeService.getTheme();

      if (authToken && currentUser) {
        setIsAuthenticated(true);
        setUser(currentUser);
        
        // Initialize socket connection
        try {
          await SocketService.initialize();
          console.log('Socket connection initialized');
        } catch (socketError) {
          console.warn('Failed to initialize socket connection:', socketError);
        }
      }

      if (userTheme) {
        setTheme(userTheme);
      }

      // Initialize notification service
      await NotificationService.initialize();

    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (userData) => {
    try {
      setIsAuthenticated(true);
      setUser(userData.user);
      await AuthService.setAuthToken(userData.token);
      await AuthService.setCurrentUser(userData.user);
      
      // Initialize socket connection after login
      try {
        await SocketService.initialize();
        console.log('Socket connection initialized after login');
      } catch (socketError) {
        console.warn('Failed to initialize socket after login:', socketError);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Clean up socket connection
      SocketService.cleanup();
      
      await AuthService.clearAuth();
      setIsAuthenticated(false);
      setUser(null);
      
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const MainTabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Medications') {
            iconName = focused ? 'pill' : 'pill';
          } else if (route.name === 'Adherence') {
            iconName = focused ? 'chart-line' : 'chart-line-variant';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else {
            iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Medications" 
        component={MedicationsScreen}
      />
      <Tab.Screen 
        name="Adherence" 
        component={AdherenceScreen}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );

  const MainStackNavigator = () => (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      
      {/* Placeholder screens for future implementation */}
      <Stack.Screen 
        name="MedicationDetails" 
        component={PlaceholderScreen}
        options={{ title: 'Medication Details' }}
      />
      <Stack.Screen 
        name="AddMedication" 
        component={PlaceholderScreen}
        options={{ title: 'Add Medication' }}
      />
      <Stack.Screen 
        name="AdherenceDetails" 
        component={PlaceholderScreen}
        options={{ title: 'Adherence Details' }}
      />
      <Stack.Screen 
        name="Prescription" 
        component={PlaceholderScreen}
        options={{ title: 'Prescriptions' }}
      />
      <Stack.Screen 
        name="Caregivers" 
        component={PlaceholderScreen}
        options={{ title: 'Caregivers' }}
      />
      <Stack.Screen 
        name="Devices" 
        component={PlaceholderScreen}
        options={{ title: 'Devices' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );

  const AuthStackNavigator = () => (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
      
      {/* Placeholder for forgot password */}
      <Stack.Screen 
        name="ForgotPassword" 
        component={PlaceholderScreen}
        options={{ title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
        <NavigationContainer theme={theme === 'dark' ? lightTheme : lightTheme}>
          <StatusBar 
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={theme === 'dark' ? '#1a1a1a' : '#ffffff'}
          />
          {isAuthenticated ? (
            <MainStackNavigator />
          ) : (
            <AuthStackNavigator />
          )}
        </NavigationContainer>
        <Toast />
      </PaperProvider>
    </SafeAreaProvider>
  );
};

// Placeholder component for screens not yet implemented
const PlaceholderScreen = ({ route }) => {
  const screenName = route.name || 'Screen';
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center', color: '#666' }}>
          {screenName} screen is coming soon!
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center', color: '#999', marginTop: 10 }}>
          This feature is under development.
        </Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;