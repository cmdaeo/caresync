// frontend/src/hooks/useCareBox.ts
import { useState, useCallback } from 'react';
import { BleClient } from '@capacitor-community/bluetooth-le';
import {
  CAREBOX_UUIDS,
  stringToDataView,
  dataViewToString,
  formatMedicationCommand,
} from '../utils/careboxProtocol';

export const useCareBox = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  // 1. Connect and Subscribe to Notifications
  const connectToBox = async () => {
    try {
      await BleClient.initialize();

      console.log('Scanning for CareBox...');
      const device = await BleClient.requestDevice({
        services: [CAREBOX_UUIDS.SERVICE],
      });

      await BleClient.connect(device.deviceId);
      setDeviceId(device.deviceId);
      setIsConnected(true);
      console.log('Connected to CareBox:', device.deviceId);

      // Start listening to the CHAR_EVENTS channel
      await BleClient.startNotifications(
        device.deviceId,
        CAREBOX_UUIDS.SERVICE,
        CAREBOX_UUIDS.CHAR_EVENTS,
        (value) => {
          const eventString = dataViewToString(value);
          console.log('Notification from Box:', eventString);
          setLastEvent(eventString);
          handleBoxNotification(eventString);
        }
      );
    } catch (error) {
      console.error('Failed to connect or subscribe:', error);
      setIsConnected(false);
    }
  };

  const disconnect = async () => {
    if (deviceId) {
      await BleClient.disconnect(deviceId);
      setDeviceId(null);
      setIsConnected(false);
    }
  };

  // 2. Send Configuration (Write)
  const sendMedicationConfig = async (
    name: string,
    timeStr: string,
    daysActive: boolean[]
  ) => {
    if (!deviceId) throw new Error('Not connected to CareBox');

    const command = formatMedicationCommand(name, timeStr, daysActive);
    console.log('Writing to Box:', command);

    await BleClient.write(
      deviceId,
      CAREBOX_UUIDS.SERVICE,
      CAREBOX_UUIDS.CHAR_CONFIG,
      stringToDataView(command)
    );
  };

  // 3. Trigger Motor Manually (Write)
  const triggerMotor = async (steps: number) => {
    if (!deviceId) throw new Error('Not connected to CareBox');
    
    // The C++ expects an int32, but sending it as a string is often safer
    // if the firmware is using a simple readString() implementation.
    // Check your C++ code to see if it expects raw bytes or a string for CHAR_MOTOR.
    // Assuming string for now based on the other implementations:
    await BleClient.write(
      deviceId,
      CAREBOX_UUIDS.SERVICE,
      CAREBOX_UUIDS.CHAR_MOTOR,
      stringToDataView(steps.toString())
    );
  }

  // 4. Handle Incoming Notifications
  const handleBoxNotification = useCallback((eventStr: string) => {
    const parts = eventStr.split('|');
    const eventType = parts[0];

    // NOTE: Replace these standard alerts with your preferred UI toast library (e.g., Sonner)
    switch (eventType) {
      case 'MED_TOMADA':
        if (parts[2] === 'pontual') {
          alert(`✅ You took ${parts[1]} on time!`);
        } else if (parts[2] === 'atraso') {
          alert(`⚠️ You took ${parts[1]} with a ${parts[3]} minute delay.`);
        }
        break;
      case 'MED_IGNORADA':
        alert(`❌ Missed dose! The drawer for ${parts[1]} was not opened.`);
        break;
      case 'RESTOCK':
        alert(`📦 Low Stock: Only ${parts[1]} doses remaining in the wheel.`);
        break;
      case 'RFID':
        if (parts[1] === 'UNKNOWN') {
          alert(`❓ Unknown RFID bracelet detected.`);
        } else {
          alert(`⌚ Bracelet authorized. Schedule: ${parts[1]}`);
        }
        break;
      default:
        console.warn('Unknown event type received:', eventType);
    }
  }, []);

  return {
    isConnected,
    lastEvent,
    connectToBox,
    disconnect,
    sendMedicationConfig,
    triggerMotor
  };
};