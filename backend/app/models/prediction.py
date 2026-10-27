from sqlalchemy import Column, String, Numeric, DateTime, JSON
from app.models.base import Base

class PredictionModel(Base):
    __tablename__ = "predictions"

    ts = Column(DateTime(timezone=True), primary_key=True)
    field_id = Column(String(32), primary_key=True)
    avri_score = Column(Numeric(5, 2), nullable=False)
    risk_class = Column(String(16), nullable=False)
    shap_values = Column(JSON, nullable=True)
    model_version = Column(String(32), nullable=False, default="piml-lgbm-v1.2")
