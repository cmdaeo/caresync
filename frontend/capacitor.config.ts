import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caresync.app',
  appName: 'CareSync',
  webDir: 'dist',
  server: {
    // Allow cleartext only in development for local testing
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0f172a',
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    scheme: 'CareSync',
  },
};

export default config;
