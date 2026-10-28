from sqlalchemy import Column, String, Numeric, DateTime, Boolean, Integer
from app.models.base import Base

class TelemetryModel(Base):
    __tablename__ = "telemetry"

    ts = Column(DateTime(timezone=True), primary_key=True)
    node_id = Column(String(32), primary_key=True)
    moisture = Column(Numeric(5, 2), nullable=True)
    soil_temp = Column(Numeric(4, 1), nullable=True)
    ph = Column(Numeric(3, 2), nullable=True)
    battery_v = Column(Numeric(4, 2), nullable=True)
    rssi_dbm = Column(Integer, nullable=True)
    is_predicted = Column(Boolean, default=False)
