export interface PhenologyStage {
  id: string;
  hstRange: string;
  name: string;
  subtitle: string;
  description: string;
  isActive?: boolean;
}

export interface FertilizerRecipe {
  stageName: string;
  stageHst: string;
  totalKg: number;
  items: Array<{
    name: string;
    amountKg: number;
    subtext?: string;
  }>;
  sacks50kg: number;
  buckets8kg: number;
  note?: string;
}

export interface ApplicationLog {
  id: string;
  stageName: string;
  hst: number;
  dateStr: string;
  mixtureSummary: string;
  avriAtApplication: number;
  statusText: string;
}

export interface AgronomyData {
  plantingDate: string; // YYYY-MM-DD
  seedVariety: string;
  areaHa: number;
  targetYieldTonHa: number;
  stages: PhenologyStage[];
  applicationLogs: ApplicationLog[];
}
