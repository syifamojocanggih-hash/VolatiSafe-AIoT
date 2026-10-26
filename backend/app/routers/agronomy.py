from fastapi import APIRouter, status
from app.schemas.agronomy import (
    FertilizerBlendRequestDTO,
    CropCycleCreateDTO
)
from app.schemas.envelope import create_envelope
from app.services.agronomy_service import AgronomyService
from app.services.mock_db import db

router = APIRouter(tags=["Agronomy"])

@router.post("/fertilizer/blend-calculator")
def calculate_blend(req: FertilizerBlendRequestDTO):
    blend_response = AgronomyService.calculate_blend(req)
    return create_envelope(blend_response.model_dump())

@router.post("/crop-cycles", status_code=status.HTTP_201_CREATED)
def create_crop_cycle(req: CropCycleCreateDTO):
    cycle_response = AgronomyService.calculate_crop_cycle(req)
    db.save_crop_cycle(cycle_response)
    return create_envelope(cycle_response.model_dump())
