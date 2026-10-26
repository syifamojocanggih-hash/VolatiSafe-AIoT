from datetime import datetime
from fastapi import APIRouter, status, Depends
from sqlalchemy.orm import Session
from app.schemas.agronomy import (
    FertilizerBlendRequestDTO,
    CropCycleCreateDTO
)
from app.schemas.envelope import create_envelope
from app.core.database import get_db
from app.models.crop_cycle import CropCycleModel
from app.services.agronomy_service import AgronomyService
from app.services.mock_db import db

router = APIRouter(tags=["Agronomy"])

@router.post("/fertilizer/blend-calculator")
def calculate_blend(req: FertilizerBlendRequestDTO):
    blend_response = AgronomyService.calculate_blend(req)
    return create_envelope(blend_response.model_dump())

@router.post("/crop-cycles", status_code=status.HTTP_201_CREATED)
def create_crop_cycle(req: CropCycleCreateDTO, session: Session = Depends(get_db)):
    cycle_response = AgronomyService.calculate_crop_cycle(req)
    try:
        cycle_model = CropCycleModel(
            cycle_id=cycle_response.cycle_id,
            field_id=req.field_id,
            planting_date=datetime.strptime(req.planting_date, "%Y-%m-%d").date(),
            corn_variety=req.seed_variety,
            target_yield_ton_ha=req.target_yield_ton_ha,
            status="active"
        )
        session.add(cycle_model)
        session.commit()
    except Exception:
        session.rollback()

    db.save_crop_cycle(cycle_response)
    return create_envelope(cycle_response.model_dump())
