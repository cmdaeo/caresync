import { registerPlugin } from '@capacitor/core';

// 1. Define the Interface for your Plugin
export interface CustomNfcPlugin {
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  addListener(
    eventName: 'nfcTagDetected',
    listenerFunc: (data: { tagId: string; timestamp: number }) => void
  ): Promise<import('@capacitor/core').PluginListenerHandle>;
}

// 2. Register the plugin with the Interface
const CustomNfc = registerPlugin<CustomNfcPlugin>('CustomNfc');

// 3. Export a helper class or function to use it cleanly in your components
export class NfcService {
  
  static async startScan() {
    try {
      await CustomNfc.startScan();
      console.log('NFC Scanning started...');
    } catch (e) {
      console.error('Error starting NFC scan:', e);
      throw e;
    }
  }

  static async stopScan() {
    try {
      await CustomNfc.stopScan();
      console.log('NFC Scanning stopped.');
    } catch (e) {
      console.error('Error stopping NFC scan:', e);
    }
  }

  static async addListener(callback: (tagId: string) => void) {
    return await CustomNfc.addListener('nfcTagDetected', (data) => {
      console.log('NFC Found:', data.tagId);
      callback(data.tagId);
    });
  }
}

export default CustomNfc;
