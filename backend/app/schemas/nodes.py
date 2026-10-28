from typing import List, Optional
from pydantic import BaseModel, Field

class NodeDTO(BaseModel):
    node_id: str
    field_id: Optional[str] = "BLOK-A"
    firmware_ver: str = "v1.0.2-prod"
    battery_v: float = 3.92
    battery_pct: int = 84
    last_seen: str = "2026-10-24T16:00:00Z"
    status: str = "online"
    # Hardware Telemetry & LoRa extensions
    bedeng_location: Optional[str] = "Blok A1 · Solokuro Lor Barat"
    transmission_status: Optional[str] = "online"
    sleep_interval_text: Optional[str] = "Online · Sleep 15m"
    moisture_pct: Optional[float] = 22.4
    soil_temp_c: Optional[float] = 34.1
    ph: Optional[float] = 7.83
    consumption_per_cycle: Optional[str] = "0,067 mAh/siklus"
    rssi_dbm: Optional[int] = -82
    snr_db: Optional[float] = 8.2
    packet_loss_pct: Optional[float] = 0.4
    timestamp_epoch: Optional[int] = 1792934400

class BoMItemDTO(BaseModel):
    id: str
    component_name: str
    pin_mapping: str
    price_idr: int
    category: str = "Sensor & Tranceiver"

class BoMResponseDTO(BaseModel):
    total_cost_idr: int = 449000
    currency: str = "IDR"
    phase_label: str = "Paket Lengkap Node Lapangan TKT-3 (IP65 + Dual Power)"
    items: List[BoMItemDTO] = Field(default_factory=list)

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
