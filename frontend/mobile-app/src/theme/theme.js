import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#E3F2FD',
    secondary: '#FF5722',
    secondaryContainer: '#FCE4EC',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    error: '#F44336',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#212121',
    onBackground: '#212121',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64B5F6',
    primaryContainer: '#0D47A1',
    secondary: '#FF5722',
    secondaryContainer: '#4E342E',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    background: '#121212',
    error: '#EF5350',
    onPrimary: '#000000',
    onSecondary: '#FFFFFF',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
  },
};

// Navigation themes
export const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#212121',
    border: '#E0E0E0',
  },
};

export const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#64B5F6',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#373737',
  },
};