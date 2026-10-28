export type WebSocketConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface LiveTelemetryPayload {
  node_id: string;
  field_id: string;
  timestamp: string;
  moisture_pct: number;
  soil_temp_c: number;
  ph: number;
  avri_score: number;
  risk_category: 'aman' | 'waspada' | 'kritis' | 'bahaya';
  is_predicted?: boolean;
  telemetry?: {
    timestamp: string;
    moisture_pct: number;
    soil_temp_c: number;
    ph: number;
    battery_voltage: number;
    is_predicted: boolean;
  };
  prediction?: {
    avri_score: number;
    risk_category: string;
    prescription?: {
      action_id: string;
      headline: string;
      recommendation: string;
      method: string;
      timing_window: string;
      shap_explanations?: Array<{
        feature?: string;
        factor?: string;
        label?: string;
        impact_pct?: number;
        attribution_pct?: number;
        direction?: string;
        impact_label?: string;
        explanation?: string;
      }>;
    };
    physics_diagnostics?: {
      k_urease_per_hour?: number;
      hydrolysis_rate?: number;
      is_physics_constrained?: boolean;
      arrhenius_kinetics_pct?: number;
      ai_residual_correction_pct?: number;
      confidence_interval_margin_pct?: number;
      base_physics_score?: number;
      residual_ai_score?: number;
      confidence_margin_pct?: number;
      decomposition_formula?: string;
    };
  };
  alert?: {
    alert_id: string;
    field_id: string;
    dispatched_at: string;
    channel: string;
    status: string;
    avri_score: number;
    headline: string;
    message: string;
  } | null;
}

export type WebSocketEvent =
  | { event: 'CONNECTED'; message: string; client_id: string }
  | { event: 'TELEMETRY_UPDATE'; data: LiveTelemetryPayload }
  | { event: 'ALERT_TRIGGERED'; data: Record<string, unknown> }
  | { event: 'FAILOVER_ACTIVATED'; data: Record<string, unknown> }
  | { event: 'ECHO'; payload: Record<string, unknown> };


