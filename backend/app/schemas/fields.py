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
    last_updated: str
    battery_pct: int
    is_simulated_failover: bool = False
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
