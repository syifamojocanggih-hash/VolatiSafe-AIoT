from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func
from app.models.base import Base

class NodeModel(Base):
    __tablename__ = "nodes"

    node_id = Column(String(32), primary_key=True)
    field_id = Column(String(32), ForeignKey("fields.field_id"), nullable=True)
    firmware_ver = Column(String(32), nullable=False, default="v1.0.2-prod")
    battery_v = Column(Numeric(4, 2), nullable=True)
    installed_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), nullable=True)
