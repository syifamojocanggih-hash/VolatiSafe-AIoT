export interface FieldNodeItem {
  id: string; // e.g. 'VS-A1-001'
  bedengLocation: string; // e.g. 'Blok A1 (Utara Atas)'
  transmissionStatus: 'online' | 'offline_simulated';
  sleepIntervalText: string; // e.g. 'Online · Sleep 15m' or 'Offline → [Est-Simulated]'
  moisturePct: number;
  tempC: number;
  ph: number;
  batteryPct: number;
  batteryV: number;
  consumptionPerCycle: string; // '0,067 mAh/siklus'
  rssiLoRa: number; // e.g. -68 dBm
  timestampEpoch: number;
}

export interface BoMItem {
  id: string;
  componentName: string;
  pinMapping: string;
  priceIdr: number;
}

export interface CalibrationParams {
  nodeId: string;
  dryAdc: number;
  wetAdc: number;
  ph4BufferAdc: number;
  ph7BufferAdc: number;
}
