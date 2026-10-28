export type RiskCategory = 'aman' | 'waspada' | 'kritis' | 'bahaya';

export interface FieldInfo {
  id: string;
  name: string;
  farmerName: string;
  location: string;
  block: string;
  areaHa: number;
  datDays: number;
  phaseName: string;
  batteryPct: number;
  lastUpdatedMinutesAgo: number;
}

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  unit: string;
  delta24h?: string;
  status: 'normal' | 'optimal' | 'warning' | 'danger';
  isAvriCard?: boolean;
}

export interface StatusBannerData {
  category: RiskCategory;
  avriScore: number;
  tag: string;
  title: string;
  description: string;
  bestWindow: string;
  openDurationText: string;
}

export interface ForecastPoint {
  time: string;
  moisture: number;
  temperature: number;
  threshold: number;
  ph?: number;
}

export interface SafeWindowSegment {
  startHour: number;
  endHour: number;
  rangeText: string;
  riskScoreText: string;
  category: RiskCategory;
  periodLabel?: string;
}

export interface DayWindowProjection {
  dayNumber: number;
  dayLabel: string;
  hourlyBlocks: boolean[]; // 24 items, true = safe
  hourlyCategories?: RiskCategory[]; // 24 items: 'aman' | 'waspada' | 'kritis' | 'bahaya'
  safeRangeText: string;
  riskScoreText: string;
  category?: RiskCategory;
  isSafe: boolean;
  safeWindows?: SafeWindowSegment[];
}

export interface DashboardState {
  field: FieldInfo;
  statusBanner: StatusBannerData;
  metrics: MetricItem[];
  trend24h: ForecastPoint[];
  forecast72h: DayWindowProjection[];
}
