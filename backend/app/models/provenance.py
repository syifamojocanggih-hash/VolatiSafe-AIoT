from sqlalchemy import Column, String, Integer, Boolean, DateTime, func
from app.models.base import Base


class DataProvenanceModel(Base):
    """
    Model audit data provenance BMKG untuk penjurian (DT-1.1 & WEATHER_REPLAY.md §3).
    Merekam sumber data cuaca, stasiun WMO, locus geografis, dan checksum integritas SHA-256.
    """
    __tablename__ = "data_provenance"

    provenance_id = Column(String(64), primary_key=True)
    source_name = Column(String(128), nullable=False)
    station_wmo_id = Column(String(32), nullable=False)
    geographic_locus = Column(String(128), nullable=False)
    dataset_period = Column(String(64), nullable=False)
    sha256_checksum = Column(String(64), nullable=False)
    total_records = Column(Integer, nullable=False)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    is_verified = Column(Boolean, default=True)
