from typing import List, Optional
from pydantic import BaseModel, Field

class NodeDTO(BaseModel):
    node_id: str
    field_id: Optional[str] = None
    firmware_ver: str = "v1.0.2-prod"
    battery_v: float = 3.87
    battery_pct: int = 84
    last_seen: str = "2026-10-24T16:00:00Z"
    status: str = "online"

class TelemetryPointDTO(BaseModel):
    timestamp: str
    moisture_pct: float
    soil_temp_c: float
    ph: float
    battery_voltage: float
    is_predicted: bool = False

class NodeTelemetrySeriesDTO(BaseModel):
    node_id: str
    hours_requested: int = 24
    points_count: int = 0
    series: List[TelemetryPointDTO] = Field(default_factory=list)
