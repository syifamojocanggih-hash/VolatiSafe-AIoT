from typing import List
from pydantic import BaseModel

class ImpactSummaryDTO(BaseModel):
    field_id: str = "BLOK-A"
    urea_efficiency_target: str = "≥ 20–35%"
    cost_savings_per_ha_idr: int = 750000
    nitrogen_loss_reduction: str = "45% → <15%"
    total_actions_recorded: int = 1
    total_urea_saved_kg: float = 45.0
    critical_hours_prevented: int = 14
    last_audit_iso: str

class ProvenanceRecordDTO(BaseModel):
    timestamp: str
    node_id: str
    block_name: str
    moisture_pct: float
    soil_temp_c: float
    ph: float
    battery_v: float
    avri_score: int
    risk_class: str
    is_predicted: bool
    provenance_source: str

class ProvenanceAuditResponseDTO(BaseModel):
    field_id: str
    total_records: int
    direct_telemetry_count: int
    failover_imputed_count: int
    records: List[ProvenanceRecordDTO]

