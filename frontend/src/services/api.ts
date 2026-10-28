/**
 * Central API Client for VolatiSafe AIoT Frontend
 * Connects directly to FastAPI Central Backend on http://localhost:8000/api/v1
 */

import { FieldNodeItem, BoMResponse } from '@/types/admin';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface BackendFieldStatus {
  field_id: string;
  field_name: string;
  farmer_name?: string;
  block?: string;
  area_ha?: number;
  crop_age_days?: number;
  crop_phase?: string;
  corn_variety?: string;
  last_updated: string;
  battery_pct: number;
  is_simulated_failover: boolean;
  is_postponed: boolean;
  postponed_at?: string | null;
  last_action?: string | null;
  metrics: {
    moisture_pct: number;
    moisture_delta_24h: number;
    soil_temp_c: number;
    soil_temp_delta_24h: number;
    ph: number;
    ph_delta_24h: number;
    avri_score: number;
    avri_category: 'aman' | 'waspada' | 'kritis' | 'bahaya';
    avri_delta_24h?: number | null;
  };
  alert_banner: {
    level: string;
    color: string;
    headline: string;
    subheadline: string;
    best_window: string;
  };
  shap_explanations?: Array<{
    feature: string;
    label: string;
    impact_pct: number;
    direction: string;
    explanation?: string;
  }>;
  physics_diagnostics?: {
    k_urease_per_hour: number;
    hydrolysis_rate: number;
    is_physics_constrained: boolean;
    base_physics_score?: number;
    residual_ai_score?: number;
    confidence_margin_pct?: number;
  };
}

export interface PostponeActionResponse {
  action_id: string;
  field_id: string;
  action: string;
  is_postponed: boolean;
  status_message: string;
  recorded_at: string;
  next_safe_window?: string;
  avri_at_action?: number;
}

export interface ActionStatusResponse {
  field_id: string;
  is_postponed: boolean;
  postponed_at?: string | null;
  last_action?: string | null;
  next_safe_window?: string;
  recent_history: Array<{
    action_id: string;
    field_id: string;
    action: string;
    is_postponed: boolean;
    status_message: string;
    recorded_at: string;
    next_safe_window?: string;
    avri_at_action?: number;
  }>;
}

export interface WhatIfSimulationRequest {
  soil_temp_c: number;
  moisture_pct: number;
  ph: number;
  rain_mm: number;
}

export interface WhatIfSimulationResponse {
  avri_score: number;
  risk_category: 'aman' | 'waspada' | 'kritis' | 'bahaya';
  safe_window_open: boolean;
  next_safe_window: {
    start_time: string;
    end_time: string;
    projected_avri: number;
    confidence_pct: number;
  };
  prescription: {
    action_id: string;
    title: string;
    summary: string;
    immediate_guidance: string;
    shap_explanations: Array<{
      feature: string;
      label: string;
      impact_pct: number;
      direction: string;
      explanation?: string;
    }>;
  };
  physics_diagnostics: {
    k_urease_per_hour: number;
    hydrolysis_rate: number;
    is_physics_constrained: boolean;
  };
  model_meta: {
    version: string;
    inferred_at: string;
  };
}

export interface BlendCalculationRequest {
  field_area_ha: number;
  crop_phase_dat: number;
  target_yield_ton_ha: number;
  soil_type?: string;
}

export interface BlendCalculationResponse {
  application_stage: string;
  recommendation_date: string;
  pure_nutrients_kg: {
    nitrogen_n: number;
    phosphate_p2o5: number;
    potassium_k2o: number;
  };
  commercial_blend_kg: {
    urea_kg: number;
    npk_phonska_kg: number;
    za_kg: number;
  };
  practical_units: {
    urea_sacks_50kg: number;
    npk_sacks_50kg: number;
    bucket_measure_8kg: number;
    instruction_text: string;
  };
}

// 1. Health Check
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json: ApiResponse<Record<string, unknown>> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// 2. Field Current Status
export async function getFieldCurrentStatus(fieldId: string = 'BLOK-A'): Promise<BackendFieldStatus | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/current-status`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json: ApiResponse<BackendFieldStatus> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// 3. Postpone / Farmer Action
export async function recordPostponeAction(
  fieldId: string = 'BLOK-A',
  action: 'postpone' | 'cancel',
  reason: string = 'AVRI_RISK_HIGH',
  notes?: string
): Promise<PostponeActionResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/postpone-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action,
        reason,
        notes: notes || (action === 'postpone' ? 'Petani menunda penaburan pupuk' : 'Pembatalan penundaan'),
      }),
    });
    if (!res.ok) return null;
    const json: ApiResponse<PostponeActionResponse> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// 4. Action Status
export async function getFieldActionStatus(fieldId: string = 'BLOK-A'): Promise<ActionStatusResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/action-status`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json: ApiResponse<ActionStatusResponse> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export interface ForecastWindowItem {
  timestamp_start: string;
  timestamp_end: string;
  avri_score: number;
  risk_category: 'aman' | 'waspada' | 'kritis' | 'bahaya';
  is_safe: boolean;
}

export interface ForecastWindowResponse {
  field_id: string;
  forecast_hours: number;
  windows: ForecastWindowItem[];
}

export interface TelemetryPoint {
  timestamp: string;
  moisture_pct: number;
  soil_temp_c: number;
  ph: number;
  battery_voltage: number;
  is_predicted?: boolean;
}

export interface NodeTelemetryResponse {
  node_id: string;
  hours_requested: number;
  points_count: number;
  series: TelemetryPoint[];
}

// 5. Forecast Window 72h
export async function getFieldForecastWindow(
  fieldId: string = 'BLOK-A',
  hours: number = 72
): Promise<ForecastWindowResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/forecast-window?hours=${hours}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json: ApiResponse<ForecastWindowResponse> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// 6. What-If Simulator (Calls Real PiML Model via FastAPI)
export async function simulateWhatIf(
  params: WhatIfSimulationRequest
): Promise<WhatIfSimulationResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/simulation/what-if`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const json: ApiResponse<WhatIfSimulationResponse> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// 7. Fertilizer Blend Calculator
export async function calculateFertilizerBlend(
  req: BlendCalculationRequest
): Promise<BlendCalculationResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/fertilizer/blend-calculator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req),
    });
    if (!res.ok) return null;
    const json: ApiResponse<BlendCalculationResponse> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// 8. Node Telemetry 24h
export async function getNodeTelemetry(
  nodeId: string = 'VS-A1-003',
  hours: number = 24
): Promise<NodeTelemetryResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/nodes/${nodeId}/telemetry?hours=${hours}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json: ApiResponse<NodeTelemetryResponse> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export interface BackendNodeItem {
  node_id: string;
  field_id?: string;
  firmware_ver: string;
  battery_v: number;
  battery_pct: number;
  last_seen: string;
  status: string;
  bedeng_location?: string;
  transmission_status?: 'online' | 'offline_simulated';
  sleep_interval_text?: string;
  moisture_pct?: number;
  soil_temp_c?: number;
  ph?: number;
  consumption_per_cycle?: string;
  rssi_dbm?: number;
  snr_db?: number;
  packet_loss_pct?: number;
  timestamp_epoch?: number;
}

export interface BackendBoMResponse {
  total_cost_idr: number;
  currency: string;
  phase_label: string;
  items: Array<{
    id: string;
    component_name: string;
    pin_mapping: string;
    price_idr: number;
    category?: string;
  }>;
}

// 8b. List All Active Field Nodes
export async function getNodesList(
  fieldId: string = 'BLOK-A'
): Promise<FieldNodeItem[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/nodes?field_id=${fieldId}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json: ApiResponse<BackendNodeItem[]> = await res.json();
    if (!json.data || !Array.isArray(json.data)) return null;

    return json.data.map((n) => ({
      id: n.node_id,
      bedengLocation: n.bedeng_location || `${n.field_id || 'Petak'} (Node ${n.node_id})`,
      transmissionStatus: (n.transmission_status as 'online' | 'offline_simulated') || (n.status === 'online' ? 'online' : 'offline_simulated'),
      sleepIntervalText: n.sleep_interval_text || (n.status === 'online' ? 'Online · Sleep 15m' : 'Offline → [Est-Simulated]'),
      moisturePct: n.moisture_pct ?? 25.0,
      tempC: n.soil_temp_c ?? 28.0,
      ph: n.ph ?? 7.2,
      batteryPct: n.battery_pct ?? 84,
      batteryV: n.battery_v ?? 3.92,
      consumptionPerCycle: n.consumption_per_cycle || '0,067 mAh/siklus',
      rssiLoRa: n.rssi_dbm ?? -76,
      snrDb: n.snr_db ?? 8.2,
      packetLossPct: n.packet_loss_pct ?? 0.4,
      timestampEpoch: n.timestamp_epoch ?? Math.floor(Date.now() / 1000),
    }));
  } catch {
    return null;
  }
}

// 8c. Hardware Bill of Materials (BoM)
export async function getHardwareBoM(): Promise<BoMResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/nodes/bom`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json: ApiResponse<BackendBoMResponse> = await res.json();
    if (!json.data) return null;

    return {
      totalCostIdr: json.data.total_cost_idr,
      currency: json.data.currency,
      phaseLabel: json.data.phase_label,
      items: (json.data.items || []).map((item) => ({
        id: item.id,
        componentName: item.component_name,
        pinMapping: item.pin_mapping,
        priceIdr: item.price_idr,
        category: item.category,
      })),
    };
  } catch {
    return null;
  }
}

// 8d. Register New Field Node (Onboarding QR)
export async function registerFieldNode(payload: {
  node_id: string;
  field_id?: string;
  bedeng_location?: string;
  firmware_ver?: string;
}): Promise<FieldNodeItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        node_id: payload.node_id,
        field_id: payload.field_id || 'BLOK-A',
        bedeng_location: payload.bedeng_location || 'Blok B3 (Timur Selatan)',
        firmware_ver: payload.firmware_ver || 'v1.0.2-prod',
      }),
    });
    if (!res.ok) return null;
    const json: ApiResponse<BackendNodeItem> = await res.json();
    if (!json.data) return null;

    const n = json.data;
    return {
      id: n.node_id,
      bedengLocation: n.bedeng_location || `${n.field_id || 'Petak'} (Node ${n.node_id})`,
      transmissionStatus: (n.transmission_status as 'online' | 'offline_simulated') || 'online',
      sleepIntervalText: n.sleep_interval_text || 'Online · Sleep 15m',
      moisturePct: n.moisture_pct ?? 35.0,
      tempC: n.soil_temp_c ?? 27.5,
      ph: n.ph ?? 7.1,
      batteryPct: n.battery_pct ?? 98,
      batteryV: n.battery_v ?? 4.15,
      consumptionPerCycle: n.consumption_per_cycle || '0,067 mAh/siklus',
      rssiLoRa: n.rssi_dbm ?? -65,
      snrDb: n.snr_db ?? 8.5,
      packetLossPct: n.packet_loss_pct ?? 0.2,
      timestampEpoch: n.timestamp_epoch ?? Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

// 9. Field Cadastral Parcels with UAV/Satellite Polygons
export interface BackendParcelItem {
  id: string;
  node_id: string;
  name: string;
  short_name: string;
  area_ha: number;
  crop_variety: string;
  moisture_pct: number;
  soil_temp_c: number;
  ph: number;
  battery_v: number;
  battery_pct: number;
  lora_signal_dbm: number;
  avri_score: number;
  avri_category: 'aman' | 'waspada' | 'kritis' | 'bahaya';
  status: 'online' | 'simulated' | 'offline';
  telemetry_mode: string;
  prescription: string;
  center: [number, number];
  polygon: [number, number][];
}

export interface FieldParcelsBackendResponse {
  field_id: string;
  summary: {
    coordinates_text: string;
    soil_type_text: string;
    gateway_distance_km: number;
    total_area_ha: number;
    center_coordinates: [number, number];
    gateway_coordinates: [number, number];
    outer_boundary: [number, number][];
    surrounding_parcels: Array<{
      id: string;
      name: string;
      area_ha: number;
      center: [number, number];
      polygon: [number, number][];
    }>;
    satellite_metadata?: {
      source: string;
      resolution: string;
      crs: string;
      last_capture: string;
      ndvi_mean?: number;
      ndwi_mean?: number;
      cloud_cover_pct?: number;
      spectral_bands?: string[];
    };
  };
  parcels: BackendParcelItem[];
  geojson?: unknown;
}

export async function getFieldParcels(
  fieldId: string = 'BLOK-A'
): Promise<FieldParcelsBackendResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/parcels`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json: ApiResponse<FieldParcelsBackendResponse> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// 10. Simulate Node Dropout & Digital Twin FAO-56 Failover
export async function toggleParcelFailover(
  fieldId: string = 'BLOK-A',
  parcelId: string = 'A1',
  isDropout?: boolean
): Promise<BackendParcelItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/fields/${fieldId}/parcels/${parcelId}/simulate-failover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ is_dropout: isDropout }),
    });
    if (!res.ok) return null;
    const json: ApiResponse<BackendParcelItem> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// 11. Digital Twin 15-Parameter Bio-Physical Telemetry
export interface DigitalTwin15Telemetry {
  field_id: string;
  timestamp_utc: string;
  data_provenance: {
    station_name: string;
    wmo_id: string;
    checksum_sha256: string;
  };
  atmosphere_bmkg: {
    air_temp_c: number;
    humidity_rh: number;
    wind_speed_ms: number;
    solar_radiation_mj: number;
    precipitation_mm: number;
  };
  soil_profile_karst: {
    clay_pct: number;
    sand_pct: number;
    silt_pct: number;
    coarse_fragments_pct: number;
    bulk_density_g_cm3: number;
    field_capacity_theta_fc: number;
    wilting_point_theta_wp: number;
  };
  soil_biophysics_dynamic: {
    moisture_pct: number;
    soil_temp_c: number;
    thermal_phase_lag_minutes: number;
    etc_daily_mm: number;
    ph: number;
    is_simulated_failover: boolean;
    failover_confidence_pct: number;
  };
  crop_and_kinetics: {
    dat: number;
    crop_stage: string;
    kc_coefficient: number;
    k_urease_rate_hr: number;
  };
}

export async function getDigitalTwinTelemetry(
  fieldId: string = 'BLOK-A'
): Promise<DigitalTwin15Telemetry | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/digital-twin/telemetry/${fieldId}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

// 13. Reports, Live Provenance & Dynamic CSV Download
export interface ReportImpactSummary {
  field_id: string;
  urea_efficiency_target: string;
  cost_savings_per_ha_idr: number;
  nitrogen_loss_reduction: string;
  total_actions_recorded: number;
  total_urea_saved_kg: number;
  critical_hours_prevented: number;
  last_audit_iso: string;
}

export interface ProvenanceAuditRecord {
  timestamp: string;
  node_id: string;
  block_name: string;
  moisture_pct: number;
  soil_temp_c: number;
  ph: number;
  battery_v: number;
  avri_score: number;
  risk_class: string;
  is_predicted: boolean;
  provenance_source: string;
}

export interface ProvenanceAuditResponse {
  field_id: string;
  total_records: number;
  direct_telemetry_count: number;
  failover_imputed_count: number;
  records: ProvenanceAuditRecord[];
}

export async function getReportImpactSummary(
  fieldId: string = 'BLOK-A'
): Promise<ReportImpactSummary | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/impact-summary?field_id=${fieldId}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function getProvenanceAudit(
  fieldId: string = 'BLOK-A',
  limit: number = 15
): Promise<ProvenanceAuditResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/provenance-audit?field_id=${fieldId}&limit=${limit}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function downloadReportCsv(
  fieldId: string = 'BLOK-A',
  hours: number = 72
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/telemetry-csv?field_id=${fieldId}&hours=${hours}`);
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volatisafe_audit_telemetri_${fieldId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}


export interface DigitalTwinForecastResponse {
  field_id?: string;
  hourly_timeline?: Array<{
    timestamp_utc: string;
    avri_score: number;
    risk_category?: string;
    [key: string]: unknown;
  }>;
  next_safe_window?: {
    start_time: string;
    end_time: string;
    projected_avri: number;
    confidence_pct?: number;
  };
  [key: string]: unknown;
}

// 12. Digital Twin 72h Forecast
export async function getDigitalTwin72hForecast(
  fieldId: string = 'BLOK-A'
): Promise<DigitalTwinForecastResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/digital-twin/forecast-72h/${fieldId}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

// 13. Reports, Live Provenance & Dynamic CSV Download
export interface ReportImpactSummary {
  field_id: string;
  urea_efficiency_target: string;
  cost_savings_per_ha_idr: number;
  nitrogen_loss_reduction: string;
  total_actions_recorded: number;
  total_urea_saved_kg: number;
  critical_hours_prevented: number;
  last_audit_iso: string;
}

export interface ProvenanceAuditRecord {
  timestamp: string;
  node_id: string;
  block_name: string;
  moisture_pct: number;
  soil_temp_c: number;
  ph: number;
  battery_v: number;
  avri_score: number;
  risk_class: string;
  is_predicted: boolean;
  provenance_source: string;
}

export interface ProvenanceAuditResponse {
  field_id: string;
  total_records: number;
  direct_telemetry_count: number;
  failover_imputed_count: number;
  records: ProvenanceAuditRecord[];
}

export async function getReportImpactSummary(
  fieldId: string = 'BLOK-A'
): Promise<ReportImpactSummary | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/impact-summary?field_id=${fieldId}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function getProvenanceAudit(
  fieldId: string = 'BLOK-A',
  limit: number = 15
): Promise<ProvenanceAuditResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/provenance-audit?field_id=${fieldId}&limit=${limit}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function downloadReportCsv(
  fieldId: string = 'BLOK-A',
  hours: number = 72
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/telemetry-csv?field_id=${fieldId}&hours=${hours}`);
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volatisafe_audit_telemetri_${fieldId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}


// 13. Reports, Live Provenance & Dynamic CSV Download
export interface ReportImpactSummary {
  field_id: string;
  urea_efficiency_target: string;
  cost_savings_per_ha_idr: number;
  nitrogen_loss_reduction: string;
  total_actions_recorded: number;
  total_urea_saved_kg: number;
  critical_hours_prevented: number;
  last_audit_iso: string;
}

export interface ProvenanceAuditRecord {
  timestamp: string;
  node_id: string;
  block_name: string;
  moisture_pct: number;
  soil_temp_c: number;
  ph: number;
  battery_v: number;
  avri_score: number;
  risk_class: string;
  is_predicted: boolean;
  provenance_source: string;
}

export interface ProvenanceAuditResponse {
  field_id: string;
  total_records: number;
  direct_telemetry_count: number;
  failover_imputed_count: number;
  records: ProvenanceAuditRecord[];
}

export async function getReportImpactSummary(
  fieldId: string = 'BLOK-A'
): Promise<ReportImpactSummary | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/impact-summary?field_id=${fieldId}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function getProvenanceAudit(
  fieldId: string = 'BLOK-A',
  limit: number = 15
): Promise<ProvenanceAuditResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/provenance-audit?field_id=${fieldId}&limit=${limit}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function downloadReportCsv(
  fieldId: string = 'BLOK-A',
  hours: number = 72
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/telemetry-csv?field_id=${fieldId}&hours=${hours}`);
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volatisafe_audit_telemetri_${fieldId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
// 13. Reports, Live Provenance & Dynamic CSV Download
export interface ReportImpactSummary {
  field_id: string;
  urea_efficiency_target: string;
  cost_savings_per_ha_idr: number;
  nitrogen_loss_reduction: string;
  total_actions_recorded: number;
  total_urea_saved_kg: number;
  critical_hours_prevented: number;
  last_audit_iso: string;
}



export interface ProvenanceAuditRecord {
  timestamp: string;
  node_id: string;
  block_name: string;
  moisture_pct: number;
  soil_temp_c: number;
  ph: number;
  battery_v: number;
  avri_score: number;
  risk_class: string;
  is_predicted: boolean;
  provenance_source: string;
}

export interface ProvenanceAuditResponse {
  field_id: string;
  total_records: number;
  direct_telemetry_count: number;
  failover_imputed_count: number;
  records: ProvenanceAuditRecord[];
}

export async function getReportImpactSummary(
  fieldId: string = 'BLOK-A'
): Promise<ReportImpactSummary | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/impact-summary?field_id=${fieldId}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function getProvenanceAudit(
  fieldId: string = 'BLOK-A',
  limit: number = 15
): Promise<ProvenanceAuditResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/provenance-audit?field_id=${fieldId}&limit=${limit}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function downloadReportCsv(
  fieldId: string = 'BLOK-A',
  hours: number = 72
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/telemetry-csv?field_id=${fieldId}&hours=${hours}`);
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volatisafe_audit_telemetri_${fieldId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}


