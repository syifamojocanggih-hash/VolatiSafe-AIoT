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


class FieldStateDTO(BaseModel):
    """
    Status kontinu biofisika tanah hasil observasi atau imputasi Digital Twin.
    Mematuhi kontrak INTERFACES.md §2 dan TASK_GUIDE.md DT-1.4.
    """
    node_id: str = Field(..., description="Node ID fisik")
    field_id: str = Field(..., description="ID Petak")
    recorded_at: str = Field(..., description="Timestamp ISO 8601 UTC")
    moisture_pct: float = Field(..., description="Kadar air tanah (% VWC)")
    soil_temp_c: float = Field(..., description="Suhu tanah (°C)")
    ph: float = Field(..., description="Nilai pH tanah")
    is_predicted: bool = Field(False, description="True jika hasil imputasi digital twin, False jika live sensor")
    confidence_score: float = Field(1.0, description="Tingkat keyakinan data (1.0 live, meluruh saat failover)")
    failover_mode: str = Field("LIVE", description="'LIVE', 'FAILOVER_IMPUTATION', atau 'CRITICAL_TIMEOUT'")
    elapsed_minutes: float = Field(0.0, description="Waktu sejak kontak sensor terakhir dalam menit")
    alert_guidance: Optional[str] = Field(None, description="Petunjuk tindakan darurat bila timeout")

    def __getitem__(self, item: str):
        return getattr(self, item)

