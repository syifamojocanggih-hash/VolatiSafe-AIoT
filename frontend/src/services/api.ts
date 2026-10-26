/**
 * Central API Client for VolatiSafe AIoT Frontend
 * Connects directly to FastAPI Central Backend on http://localhost:8000/api/v1
 */

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
