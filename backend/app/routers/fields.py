from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.envelope import create_envelope
from app.services.mock_db import db

router = APIRouter(prefix="/fields", tags=["Fields"])

@router.get("/{field_id}/current-status")
def get_field_current_status(field_id: str):
    field_status = db.get_field_status(field_id=field_id)
    if not field_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "FIELD_NOT_FOUND",
                "message": f"Petak dengan ID '{field_id}' tidak ditemukan di sistem."
            }
        )
    return create_envelope(field_status.model_dump())

@router.get("/{field_id}/forecast-window")
def get_field_forecast_window(
    field_id: str,
    hours: int = Query(72, ge=1, le=168, description="Rentang proyeksi masa depan dalam jam")
):
    forecast = db.get_forecast_window(field_id=field_id, hours=hours)
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "FIELD_NOT_FOUND",
                "message": f"Petak dengan ID '{field_id}' tidak ditemukan di sistem."
            }
        )
    return create_envelope(forecast.model_dump())
