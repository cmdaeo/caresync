import { Capacitor, registerPlugin } from '@capacitor/core';

// ─── NFC Plugin Contract ───
// Matches @CapacitorPlugin(name = "CustomNfc") in the Android/iOS native code
export interface NfcPluginContract {
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  addListener(
    eventName: 'nfcTagDetected',
    listenerFunc: (data: { tagId: string; timestamp: number }) => void
  ): Promise<any>;
  removeAllListeners(): Promise<void>;
}

// ─── BLE Device Result ───
export interface BleDeviceResult {
  deviceId: string;
  name: string;
  rssi?: number;
}

const CustomNfc = registerPlugin<NfcPluginContract>('CustomNfc');

// ─── Platform Detection ───
export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();
export const getPlatform = (): 'web' | 'android' | 'ios' => Capacitor.getPlatform() as any;

// ─── Safe Wrappers ───
// These ensure the app doesn't crash when running in a browser
// where native plugins are unavailable.
export const NativeBridge = {
  nfc: CustomNfc,

  /** Check if NFC scanning is available (native only) */
  canScanNfc: async (): Promise<boolean> => {
    if (!isNativePlatform()) return false;
    try {
      // On Android, NFC availability is checked natively
      return true;
    } catch {
      return false;
    }
  },

  /** Check if BLE scanning is available (native only) */
  canScanBle: async (): Promise<boolean> => {
    if (!isNativePlatform()) return false;
    try {
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      await BleClient.initialize();
      return true;
    } catch {
      return false;
    }
  },

  /** Scan for nearby BLE devices for a given timeout */
  scanBleDevices: async (timeoutMs = 5000): Promise<BleDeviceResult[]> => {
    if (!isNativePlatform()) return [];
    try {
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      await BleClient.initialize();

      const devices: BleDeviceResult[] = [];
      const seen = new Set<string>();

      await BleClient.requestLEScan({}, (result) => {
        if (result.device.name && !seen.has(result.device.deviceId)) {
          seen.add(result.device.deviceId);
          devices.push({
            deviceId: result.device.deviceId,
            name: result.device.name,
            rssi: result.rssi,
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, timeoutMs));
      await BleClient.stopLEScan();

      return devices;
    } catch (err) {
      console.warn('[NativeBridge] BLE scan failed:', err);
      return [];
    }
  },

  /** Connect to a BLE device by ID */
  connectBle: async (deviceId: string): Promise<boolean> => {
    if (!isNativePlatform()) return false;
    try {
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      await BleClient.connect(deviceId);
      return true;
    } catch (err) {
      console.warn('[NativeBridge] BLE connect failed:', err);
      return false;
    }
  },

  /** Disconnect from a BLE device */
  disconnectBle: async (deviceId: string): Promise<void> => {
    if (!isNativePlatform()) return;
    try {
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      await BleClient.disconnect(deviceId);
    } catch (err) {
      console.warn('[NativeBridge] BLE disconnect failed:', err);
    }
  },
};
