import { registerPlugin } from '@capacitor/core';

export interface CustomNfcPlugin {
  startScan(): Promise<void>;
}

const CustomNfc = registerPlugin<CustomNfcPlugin>('CustomNfc');

export default CustomNfc;
