export interface GanttPhase {
  id: string;
  name: string;
  subtitle: string;
  start_hst: number;
  end_hst: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: 'completed' | 'active' | 'upcoming';
  progress_pct: number;
  fertilizer_action?: string | null;
  h3_reminder_date?: string | null;
  description: string;
  color_theme: string;
}

export interface CropMilestone {
  milestone_id: string;
  target_dat: number;
  phase_name: string;
  target_date: string;
  h3_alert_date: string;
  action_required: string;
}

export interface CropCycleResponse {
  cycle_id: string;
  field_id: string;
  planting_date: string;
  seed_variety: string;
  field_area_ha: number;
  target_yield_ton_ha: number;
  current_dat: number;
  growth_stage: string;
  total_duration_days: number;
  harvest_estimate_date: string;
  gantt_phases: GanttPhase[];
  milestones: CropMilestone[];
}

export interface CropCycleRequest {
  field_id: string;
  planting_date: string;
  seed_variety: string;
  field_area_ha: number;
  target_yield_ton_ha: number;
}

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
