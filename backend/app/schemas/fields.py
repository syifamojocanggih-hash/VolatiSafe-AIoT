from typing import List, Optional
from pydantic import BaseModel, Field

class FieldMetricsDTO(BaseModel):
    moisture_pct: float
    moisture_delta_24h: float
    soil_temp_c: float
    soil_temp_delta_24h: float
    ph: float
    ph_delta_24h: float
    avri_score: float
    avri_category: str
    avri_delta_24h: Optional[float] = None

class AlertBannerDTO(BaseModel):
    level: str
    color: str
    headline: str
    subheadline: str
    best_window: str

class ShapExplanationDTO(BaseModel):
    feature: str
    label: str
    impact_pct: float
    direction: str  # "increases_risk", "decreases_risk", "neutral"
    explanation: Optional[str] = None

class FieldCurrentStatusDTO(BaseModel):
    field_id: str
    field_name: str
    farmer_name: Optional[str] = "Pak Suparman"
    block: Optional[str] = "Blok A"
    area_ha: Optional[float] = 0.75
    crop_age_days: Optional[int] = 32
    crop_phase: Optional[str] = "Fase 8 Vegetatif"
    corn_variety: Optional[str] = "BISI-18"
    last_updated: str
    battery_pct: int
    is_simulated_failover: bool = False
    is_postponed: bool = False
    postponed_at: Optional[str] = None
    last_action: Optional[str] = None
    metrics: FieldMetricsDTO
    alert_banner: AlertBannerDTO
    shap_explanations: Optional[List[ShapExplanationDTO]] = None

class ForecastWindowItemDTO(BaseModel):
    timestamp_start: str
    timestamp_end: str
    avri_score: float
    risk_category: str
    is_safe: bool

class ForecastWindowDTO(BaseModel):
    field_id: str
    forecast_hours: int = 72
    windows: List[ForecastWindowItemDTO] = Field(default_factory=list)

class FarmerActionRequestDTO(BaseModel):
    action: str = Field(..., description="'postpone', 'cancel', 'override_apply', or 'irrigate'")
    reason: Optional[str] = "AVRI_RISK_HIGH"
    notes: Optional[str] = None
    urea_kg: Optional[float] = 0.0
    npk_kg: Optional[float] = 0.0

class FarmerActionResponseDTO(BaseModel):
    action_id: str
    field_id: str
    action: str
    is_postponed: bool
    status_message: str
    recorded_at: str
    next_safe_window: Optional[str] = None
    avri_at_action: Optional[float] = None

