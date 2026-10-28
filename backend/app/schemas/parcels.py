from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SurroundingParcelDTO(BaseModel):
    id: str
    name: str
    area_ha: float
    center: List[float]  # [lat, lng]
    polygon: List[List[float]]  # [[lat, lng], ...]

class BedengParcelDTO(BaseModel):
    id: str
    node_id: str
    name: str
    short_name: str
    area_ha: float
    crop_variety: str
    moisture_pct: float
    soil_temp_c: float
    ph: float
    battery_v: float
    battery_pct: int
    lora_signal_dbm: int
    avri_score: int
    avri_category: str  # 'aman' | 'waspada' | 'kritis' | 'bahaya'
    status: str  # 'online' | 'simulated' | 'offline'
    telemetry_mode: str  # 'LoRa Live Stream' | '[Est-Simulated] FAO-56'
    prescription: str
    center: List[float]  # [lat, lng]
    polygon: List[List[float]]  # [[lat, lng], ...]

class SatelliteMetadataDTO(BaseModel):
    source: str = "Google Hybrid Satellite & Sentinel-2 MultiSpectral"
    resolution: str = "0.3m GSD High-Resolution Aerial Orthophoto"
    crs: str = "EPSG:4326 (WGS84)"
    last_capture: str = "2026-10-25T08:45:00Z"
    ndvi_mean: float = 0.74
    ndwi_mean: float = 0.31
    cloud_cover_pct: float = 1.8
    spectral_bands: List[str] = ["B2 (Blue)", "B3 (Green)", "B4 (Red)", "B8 (NIR)", "B11 (SWIR)"]

class ParcelMapSummaryDTO(BaseModel):
    coordinates_text: str = '6°54\'54"S 112°25\'19"E'
    soil_type_text: str = 'Hamparan Persawahan Jagung Desa Bluri (Aluvial Lempung Subur pH 7.2)'
    gateway_distance_km: float = 0.32
    total_area_ha: float = 0.96
    center_coordinates: List[float] = [-6.902683, 112.430223]
    gateway_coordinates: List[float] = [-6.901850, 112.430500]
    outer_boundary: List[List[float]] = Field(default_factory=list)
    surrounding_parcels: List[SurroundingParcelDTO] = Field(default_factory=list)
    satellite_metadata: SatelliteMetadataDTO = Field(default_factory=SatelliteMetadataDTO)

class FieldParcelsResponseDTO(BaseModel):
    field_id: str
    summary: ParcelMapSummaryDTO
    parcels: List[BedengParcelDTO] = Field(default_factory=list)
    geojson: Optional[Dict[str, Any]] = None

class SimulateFailoverRequestDTO(BaseModel):
    is_dropout: Optional[bool] = None
