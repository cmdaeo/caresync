import type { CapacitorConfig } from '@capacitor/cli';
import { Capacitor } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.caresync.app',
  appName: 'CareSync',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;