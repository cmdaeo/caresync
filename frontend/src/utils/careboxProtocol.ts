// frontend/src/utils/careboxProtocol.ts

// These must perfectly match the SERVICE and CHAR UUIDs in the C++ firmware
export const CAREBOX_UUIDS = {
  SERVICE: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  CHAR_MOTOR: 'a1b2c3d4-e5f6-7890-abcd-ef1234567891',
  CHAR_EVENTS: 'a1b2c3d4-e5f6-7890-abcd-ef1234567892', // The notification channel
  CHAR_CONFIG: 'a1b2c3d4-e5f6-7890-abcd-ef1234567893', // The write channel
  CHAR_STATS: 'a1b2c3d4-e5f6-7890-abcd-ef1234567894',
};

// Utility to convert a string to a DataView (required by Capacitor BLE)
export const stringToDataView = (text: string): DataView => {
  const buffer = new ArrayBuffer(text.length);
  const view = new DataView(buffer);
  for (let i = 0; i < text.length; i++) {
    view.setUint8(i, text.charCodeAt(i));
  }
  return view;
};

// Utility to convert a DataView (from the Box) back to a readable string
export const dataViewToString = (data: DataView): string => {
  let str = '';
  for (let i = 0; i < data.byteLength; i++) {
    str += String.fromCharCode(data.getUint8(i));
  }
  return str;
};

/**
 * Formats the medication data into the string expected by the C++ Firmware:
 * "MED|nome|minutos|dias"
 */
export const formatMedicationCommand = (
  name: string,
  timeStr: string, // format: "HH:MM" (e.g., "14:30")
  daysActive: boolean[] // array of 7 booleans [Mon, Tue, Wed...]
): string => {
  // Convert "14:30" into total minutes from midnight (870)
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;

  // Convert boolean array to binary string (e.g., "1010100")
  const daysStr = daysActive.map((active) => (active ? '1' : '0')).join('');

  // Remove pipes from the name to prevent breaking the C++ parsing logic
  const cleanName = name.replace(/\|/g, '').trim();

  return `MED|${cleanName}|${totalMinutes}|${daysStr}`;
};