from sqlalchemy import Column, String, Numeric, DateTime, Date, ForeignKey, func, Text
from app.models.base import Base

class CropCycleModel(Base):
    __tablename__ = "crop_cycles"

    cycle_id = Column(String(36), primary_key=True)
    field_id = Column(String(32), ForeignKey("fields.field_id"), nullable=True)
    planting_date = Column(Date, nullable=False)
    corn_variety = Column(String(64), nullable=False)
    target_yield_ton_ha = Column(Numeric(4, 2), default=8.0)
    status = Column(String(24), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FertilizationLogModel(Base):
    __tablename__ = "fertilization_logs"

    log_id = Column(String(36), primary_key=True)
    field_id = Column(String(32), ForeignKey("fields.field_id"), nullable=True)
    applied_at = Column(DateTime(timezone=True), nullable=False)
    stage_name = Column(String(64), nullable=False)
    urea_kg = Column(Numeric(6, 2), nullable=False)
    npk_phonska_kg = Column(Numeric(6, 2), nullable=False)
    za_kg = Column(Numeric(6, 2), default=0.0)
    avri_at_time = Column(Numeric(5, 2), nullable=True)
    notes = Column(Text, nullable=True)
