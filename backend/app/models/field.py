from sqlalchemy import Column, String, Numeric, DateTime, func
from app.models.base import Base

class FieldModel(Base):
    __tablename__ = "fields"

    field_id = Column(String(32), primary_key=True)
    name = Column(String(128), nullable=False)
    owner_name = Column(String(128), nullable=False)
    owner_phone = Column(String(32), nullable=False)
    village = Column(String(64), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    area_ha = Column(Numeric(5, 2), nullable=False)
    soil_type = Column(String(64), default="clay_alkaline")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FieldStateModel(Base):
    __tablename__ = "field_state"

    field_id = Column(String(32), primary_key=True)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    theta = Column(Numeric(5, 2), nullable=False)
    t_soil = Column(Numeric(4, 1), nullable=False)
    ph = Column(Numeric(3, 2), nullable=False)
    et0_today = Column(Numeric(5, 2), default=0.0)
    dat = Column(Numeric(4, 0), default=0)
    last_urea_kg = Column(Numeric(6, 2), default=0.0)
