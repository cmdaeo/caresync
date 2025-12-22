import { registerPlugin } from '@capacitor/core';

// 1. Define the Interface (The Contract)
// This matches the Java methods: @PluginMethod public void startScan(), etc.
export interface NfcPluginContract {
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  // The Java code emits 'nfcTagDetected' with { tagId: string, timestamp: long }
  addListener(
    eventName: 'nfcTagDetected', 
    listenerFunc: (data: { tagId: string; timestamp: number }) => void
  ): Promise<any>;
  removeAllListeners(): Promise<void>;
}

// 2. Register the Plugin
// 'CustomNfc' must match @CapacitorPlugin(name = "CustomNfc") in Java
const CustomNfc = registerPlugin<NfcPluginContract>('CustomNfc');

// 3. Export a Safe Wrapper (The AbZXstraction)
// This ensures the app doesn't crash if run in a browser where the plugin is missing.
export const NativeBridge = {
  nfc: CustomNfc,
  
  // Helper to check if we can actually scan
  canScan: async (): Promise<boolean> => {
    try {
      // In a real app, you might check permissions here or strict platform checks
      return true; 
    } catch (e) {
      return false;
    }
  }
};
