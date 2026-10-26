from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.fields import ShapExplanationDTO

class WhatIfRequestDTO(BaseModel):
    soil_temp_c: float = Field(..., ge=-10.0, le=60.0, description="Suhu tanah (°C)")
    moisture_pct: float = Field(..., ge=0.0, le=100.0, description="Kelembaban tanah (% VWC)")
    ph: float = Field(..., ge=3.0, le=10.0, description="pH tanah")
    rain_mm: float = Field(0.0, ge=0.0, description="Curah hujan atau prakiraan hujan (mm)")
    air_temp_c: Optional[float] = Field(None, description="Suhu udara ambien (°C)")
    wind_speed_ms: Optional[float] = Field(None, description="Kecepatan angin (m/s)")

class SafeWindowDTO(BaseModel):
    start_time: str
    end_time: str
    projected_avri: float
    confidence_pct: int

class PrescriptionDTO(BaseModel):
    action_id: str
    title: str
    summary: str
    immediate_guidance: str
    shap_explanations: List[ShapExplanationDTO] = Field(default_factory=list)

class PhysicsDiagnosticsDTO(BaseModel):
    k_urease_per_hour: float
    hydrolysis_rate: float
    is_physics_constrained: bool = True

class ModelMetaDTO(BaseModel):
    version: str = "piml-lgbm-v1.2"
    inferred_at: str

class PredictRiskResponseDTO(BaseModel):
    avri_score: float
    risk_category: str
    safe_window_open: bool
    next_safe_window: SafeWindowDTO
    prescription: PrescriptionDTO
    physics_diagnostics: Optional[PhysicsDiagnosticsDTO] = None
    model_meta: ModelMetaDTO
