from typing import List, Optional
from pydantic import BaseModel, Field

class FertilizerBlendRequestDTO(BaseModel):
    field_area_ha: float = Field(0.75, ge=0.01, description="Luas lahan dalam hektar")
    crop_phase_dat: int = Field(30, ge=0, description="Hari Setelah Tanam (HST / DAT)")
    target_yield_ton_ha: float = Field(8.0, ge=1.0, description="Target tonase panen per hektar")
    soil_type: str = Field("clay_alkaline", description="Tipe tanah (misal clay_alkaline, alluvium)")

class PureNutrientsDTO(BaseModel):
    nitrogen_n: float
    phosphate_p2o5: float
    potassium_k2o: float

class CommercialBlendDTO(BaseModel):
    urea_kg: float
    npk_phonska_kg: float
    za_kg: float = 0.0

class PracticalUnitsDTO(BaseModel):
    urea_sacks_50kg: float
    npk_sacks_50kg: float
    bucket_measure_8kg: int
    instruction_text: str

class FertilizerBlendResponseDTO(BaseModel):
    application_stage: str
    recommendation_date: str
    pure_nutrients_kg: PureNutrientsDTO
    commercial_blend_kg: CommercialBlendDTO
    practical_units: PracticalUnitsDTO

class CropCycleCreateDTO(BaseModel):
    field_id: str = "BLOK-A"
    planting_date: str = "2026-11-01"
    seed_variety: str = "BISI-18"
    field_area_ha: float = 0.75
    target_yield_ton_ha: float = 8.0

class CropMilestoneDTO(BaseModel):
    phase: str
    target_dat: int
    calendar_date: str
    h3_alert_date: str
    action_required: str

class CropCycleResponseDTO(BaseModel):
    cycle_id: str
    field_id: str
    planting_date: str
    current_dat: int
    growth_stage: str
    milestones: List[CropMilestoneDTO] = Field(default_factory=list)

class FertilizationLogCreateDTO(BaseModel):
    field_id: str = "BLOK-A"
    stage_name: str = Field(..., description="Contoh: 'Fase V8 (Pemupukan Susulan I)'")
    applied_at: Optional[str] = Field(None, description="Tanggal/waktu aplikasi ISO atau YYYY-MM-DD")
    hst: Optional[int] = Field(30, description="Hari Setelah Tanam (HST / DAT)")
    urea_kg: float = Field(0.0, ge=0.0)
    npk_phonska_kg: float = Field(0.0, ge=0.0)
    za_kg: float = Field(0.0, ge=0.0)
    avri_at_time: Optional[float] = Field(None, description="Skor AVRI saat pemupukan (%)")
    notes: Optional[str] = None

class FertilizationLogResponseDTO(BaseModel):
    log_id: str
    field_id: str
    applied_at: str
    date_str: str
    stage_name: str
    hst: int
    urea_kg: float
    npk_phonska_kg: float
    za_kg: float
    total_kg: float
    buckets_count: int
    mixture_summary: str
    avri_at_time: float
    status_text: str
    notes: Optional[str] = None

