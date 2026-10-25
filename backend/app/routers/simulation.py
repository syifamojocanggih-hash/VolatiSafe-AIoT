from fastapi import APIRouter
from app.schemas.simulation import WhatIfRequestDTO
from app.schemas.envelope import create_envelope
from app.services.ai_service import AIService

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/what-if")
def simulate_what_if(req: WhatIfRequestDTO):
    prediction = AIService.predict_avri(req)
    return create_envelope(prediction.model_dump())
