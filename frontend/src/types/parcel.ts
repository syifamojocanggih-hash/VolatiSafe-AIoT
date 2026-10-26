export type ParcelStatus = 'online' | 'simulated' | 'offline';
export type ActiveLayer = 'avri' | 'battery' | 'lora';

export interface BedengParcel {
  id: string; // e.g. 'A1'
  nodeId: string; // e.g. 'VS-A1-001'
  name: string; // e.g. 'Blok A1 (Utara Atas)'
  shortName: string; // e.g. 'A1 · Utara Atas'
  areaHa: number; // e.g. 0.45
  cropVariety: string; // e.g. 'Bisi-18'
  moisturePct: number; // e.g. 22.4
  soilTempC: number; // e.g. 34.1
  ph: number; // e.g. 7.83
  batteryV: number; // e.g. 3.92
  batteryPct: number; // e.g. 84
  loraSignalDbm: number; // e.g. -78
  avriScore: number; // e.g. 74
  avriCategory: 'aman' | 'waspada' | 'kritis' | 'bahaya';
  status: ParcelStatus;
  telemetryMode: string; // e.g. 'LoRa Live Stream' or '[Est-Simulated] FAO-56'
  prescription: string; // e.g. 'Tunda! Tunggu hujan...'
  polygon?: [number, number][]; // Poligon koordinat geografis [lat, lng]
  center?: [number, number]; // Titik tengah lokasi node sensor [lat, lng]
}

export interface SurroundingParcel {
  id: string; // e.g. 'C01'
  name: string; // e.g. 'Persil Tegal Kapur Bluri 01'
  areaHa: number;
  center: [number, number];
  polygon: [number, number][];
}

export interface ParcelMapSummary {
  coordinatesText: string;
  soilTypeText: string;
  gatewayDistanceKm: number;
  totalAreaHa: number;
  centerCoordinates?: [number, number];
  gatewayCoordinates?: [number, number];
  outerBoundary?: [number, number][];
  surroundingParcels?: SurroundingParcel[];
}
