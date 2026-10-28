import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session
from app.schemas.envelope import create_envelope
from app.schemas.fields import (
    FarmerActionRequestDTO,
    FarmerActionResponseDTO,
    FieldCurrentStatusDTO,
    FieldMetricsDTO,
    AlertBannerDTO,
    ShapExplanationDTO
)
from app.schemas.simulation import WhatIfRequestDTO
from app.schemas.parcels import SimulateFailoverRequestDTO
from app.core.database import get_db
from app.models.field import FieldModel, FieldStateModel
from app.models.node import NodeModel
from app.models.telemetry import TelemetryModel
from app.models.prediction import PredictionModel
from app.models.crop_cycle import FertilizationLogModel
from app.services.ai_service import AIService
from app.services.mock_db import db

router = APIRouter(prefix="/fields", tags=["Fields"])

@router.get("/{field_id}/current-status")
def get_field_current_status(field_id: str, session: Session = Depends(get_db)):
    try:
        field_rec = session.query(FieldModel).filter(FieldModel.field_id == field_id).first()
        state_rec = session.query(FieldStateModel).filter(FieldStateModel.field_id == field_id).first()

        if field_rec and state_rec:
            # Query primary node for battery
            node_rec = session.query(NodeModel).filter(NodeModel.field_id == field_id).first()
            battery_pct = int(max(0, min(100, (float(node_rec.battery_v or 3.0) - 3.0) / (4.2 - 3.0) * 100))) if node_rec else 84

            # Query latest farmer action
            last_log = (
                session.query(FertilizationLogModel)
                .filter(FertilizationLogModel.field_id == field_id)
                .order_by(FertilizationLogModel.applied_at.desc())
                .first()
            )
            is_postponed = (last_log.stage_name == "TUNDA_APLIKASI") if last_log else False
            postponed_at = last_log.applied_at.strftime("%Y-%m-%dT%H:%M:%SZ") if (last_log and is_postponed) else None
            last_action_str = last_log.stage_name if last_log else None

            # Compute real AVRI via AIService
            ai_req = WhatIfRequestDTO(
                soil_temp_c=float(state_rec.t_soil),
                moisture_pct=float(state_rec.theta),
                ph=float(state_rec.ph),
                rain_mm=0.0
            )
            pred_res = AIService.predict_avri(ai_req)

            # Alert banner mapping (4 tingkat: aman, waspada, kritis, bahaya)
            category = pred_res.risk_category
            color = (
                "#DC2626" if category == "bahaya"
                else ("#EA580C" if category == "kritis"
                else ("#CA8A04" if category == "waspada"
                else "#16A34A"))
            )
            headline = f"RISIKO {category.upper()} — AVRI {pred_res.avri_score:.0f}%"

            # Phenology / crop cycle mapping
            dat = int(state_rec.dat or 32)
            if dat <= 7:
                crop_phase = "Fase Perkecambahan (VE)"
            elif dat <= 20:
                crop_phase = "Fase Daun Tiga (V3)"
            elif dat <= 40:
                crop_phase = "Fase 8 Vegetatif"
            elif dat <= 65:
                crop_phase = "Fase Daun Dua Belas / Bunting (V12)"
            elif dat <= 90:
                crop_phase = "Fase Pengisian Biji (R3)"
            else:
                crop_phase = "Fase Masak Fisiologis (R6)"

            block_name = "Blok A"
            if "Blok B" in field_rec.name:
                block_name = "Blok B"
            elif "Blok C" in field_rec.name:
                block_name = "Blok C"

            # Dynamic 24-hour Telemetry Delta Comparison
            curr_ts = state_rec.updated_at if state_rec.updated_at else datetime.now(timezone.utc)
            target_24h_ts = curr_ts - timedelta(hours=24)
            primary_node_id = node_rec.node_id if node_rec else "VS-A1-003"

            t24_telemetry = (
                session.query(TelemetryModel)
                .filter(TelemetryModel.node_id == primary_node_id)
                .filter(TelemetryModel.ts <= target_24h_ts)
                .order_by(TelemetryModel.ts.desc())
                .first()
            )
            if not t24_telemetry:
                # If no telemetry at or before target_24h_ts, look for earliest available record before curr_ts
                t24_telemetry = (
                    session.query(TelemetryModel)
                    .filter(TelemetryModel.node_id == primary_node_id)
                    .filter(TelemetryModel.ts < curr_ts)
                    .order_by(TelemetryModel.ts.asc())
                    .first()
                )

            if t24_telemetry and t24_telemetry.ts != curr_ts:
                moisture_delta_24h = round(float(state_rec.theta) - float(t24_telemetry.moisture or state_rec.theta), 1)
                soil_temp_delta_24h = round(float(state_rec.t_soil) - float(t24_telemetry.soil_temp or state_rec.t_soil), 1)
                ph_delta_24h = round(float(state_rec.ph) - float(t24_telemetry.ph or state_rec.ph), 2)
            else:
                moisture_delta_24h = 0.0
                soil_temp_delta_24h = 0.0
                ph_delta_24h = 0.0

            # Dynamic 24-hour AVRI Delta Comparison
            t24_pred = (
                session.query(PredictionModel)
                .filter(PredictionModel.field_id == field_id)
                .filter(PredictionModel.ts <= target_24h_ts)
                .order_by(PredictionModel.ts.desc())
                .first()
            )
            if not t24_pred:
                t24_pred = (
                    session.query(PredictionModel)
                    .filter(PredictionModel.field_id == field_id)
                    .filter(PredictionModel.ts < curr_ts)
                    .order_by(PredictionModel.ts.asc())
                    .first()
                )

            avri_delta_24h = (
                round(pred_res.avri_score - float(t24_pred.avri_score), 1)
                if t24_pred and t24_pred.ts != curr_ts
                else None
            )

            return create_envelope(FieldCurrentStatusDTO(
                field_id=field_rec.field_id,
                field_name=field_rec.name,
                farmer_name=field_rec.owner_name or "Pak Suparman",
                block=block_name,
                area_ha=float(field_rec.area_ha or 0.75),
                crop_age_days=dat,
                crop_phase=crop_phase,
                corn_variety="BISI-18",
                last_updated=state_rec.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if state_rec.updated_at else datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                battery_pct=battery_pct,
                is_simulated_failover=False,
                is_postponed=is_postponed,
                postponed_at=postponed_at,
                last_action=last_action_str,
                metrics=FieldMetricsDTO(
                    moisture_pct=float(state_rec.theta),
                    moisture_delta_24h=moisture_delta_24h,
                    soil_temp_c=float(state_rec.t_soil),
                    soil_temp_delta_24h=soil_temp_delta_24h,
                    ph=float(state_rec.ph),
                    ph_delta_24h=ph_delta_24h,
                    avri_score=pred_res.avri_score,
                    avri_category=category,
                    avri_delta_24h=avri_delta_24h
                ),
                alert_banner=AlertBannerDTO(
                    level=category,
                    color=color,
                    headline=headline,
                    subheadline=pred_res.prescription.immediate_guidance,
                    best_window=pred_res.next_safe_window.start_time if pred_res.next_safe_window else "06:00 – 09:00 WIB"
                ),
                shap_explanations=pred_res.prescription.shap_explanations,
                physics_diagnostics=pred_res.physics_diagnostics
            ).model_dump())
    except Exception:
        pass

    # Fallback to in-memory store
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

@router.post("/{field_id}/postpone-action", status_code=status.HTTP_200_OK)
def record_postpone_action(
    field_id: str,
    req: FarmerActionRequestDTO,
    session: Session = Depends(get_db)
):
    action_lower = req.action.lower()
    is_postponing = action_lower in ["postpone", "tunda", "delay"]
    is_cancelling = action_lower in ["cancel", "resume", "batal", "cancel_postpone"]
    stage_name = "TUNDA_APLIKASI" if is_postponing else ("BATAL_TUNDA" if is_cancelling else req.action.upper())
    action_id = f"act-{uuid.uuid4().hex[:8]}"

    # Write to TimescaleDB
    try:
        log = FertilizationLogModel(
            log_id=action_id,
            field_id=field_id,
            applied_at=datetime.now(timezone.utc),
            stage_name=stage_name,
            urea_kg=req.urea_kg or 0.0,
            npk_phonska_kg=req.npk_kg or 0.0,
            za_kg=0.0,
            avri_at_time=74.0,
            notes=req.notes or f"Aksi Petani: {req.reason or 'Penundaan Pemupukan'}"
        )
        session.add(log)
        session.commit()
    except Exception:
        session.rollback()

    # Sync with memory store
    res = db.record_farmer_action(
        field_id=field_id,
        action=req.action,
        reason=req.reason,
        notes=req.notes,
        urea_kg=req.urea_kg or 0.0,
        npk_kg=req.npk_kg or 0.0
    )
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "FIELD_NOT_FOUND",
                "message": f"Petak dengan ID '{field_id}' tidak ditemukan di sistem."
            }
        )
    return create_envelope(res.model_dump())

@router.get("/{field_id}/action-status")
def get_action_status(field_id: str, session: Session = Depends(get_db)):
    try:
        logs = (
            session.query(FertilizationLogModel)
            .filter(FertilizationLogModel.field_id == field_id)
            .order_by(FertilizationLogModel.applied_at.desc())
            .all()
        )
        if logs:
            last = logs[0]
            is_postponed = last.stage_name == "TUNDA_APLIKASI"
            postponed_at = last.applied_at.strftime("%Y-%m-%dT%H:%M:%SZ") if is_postponed else None

            history = []
            for l in logs[:10]:
                history.append({
                    "action_id": l.log_id,
                    "field_id": field_id,
                    "action": l.stage_name,
                    "is_postponed": l.stage_name == "TUNDA_APLIKASI",
                    "status_message": l.notes or l.stage_name,
                    "recorded_at": l.applied_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "next_safe_window": "Besok Pagi, 06:00 – 09:00 WIB",
                    "avri_at_action": float(l.avri_at_time or 74.0)
                })

            return create_envelope({
                "field_id": field_id,
                "is_postponed": is_postponed,
                "postponed_at": postponed_at,
                "last_action": last.stage_name,
                "next_safe_window": "Besok Pagi, 06:00 – 09:00 WIB",
                "recent_history": history
            })
    except Exception:
        pass

    action_status = db.get_farmer_action_status(field_id=field_id)
    if not action_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "FIELD_NOT_FOUND",
                "message": f"Petak dengan ID '{field_id}' tidak ditemukan di sistem."
            }
        )
    return create_envelope(action_status)

@router.get("/{field_id}/parcels")
def get_field_parcels(field_id: str):
    """
    Returns 12 high-precision bedeng cadastral parcels, surrounding mosaic parcels,
    and outer boundary with GeoJSON FeatureCollection derived from Sentinel-2 & UAV orthomosaic.
    """
    res = db.get_field_parcels(field_id=field_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "FIELD_PARCELS_NOT_FOUND",
                "message": f"Data persil untuk petak '{field_id}' tidak ditemukan."
            }
        )
    return create_envelope(res.model_dump())

@router.post("/{field_id}/parcels/{parcel_id}/simulate-failover")
def simulate_parcel_failover(
    field_id: str,
    parcel_id: str,
    req: Optional[SimulateFailoverRequestDTO] = None
):
    """
    Toggles node dropout and triggers Digital Twin FAO-56 failover on the backend.
    """
    is_dropout = req.is_dropout if req else None
    updated_parcel = db.toggle_parcel_failover(
        field_id=field_id,
        parcel_id=parcel_id,
        is_dropout=is_dropout
    )
    if not updated_parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "PARCEL_NOT_FOUND",
                "message": f"Persil/Bedeng dengan ID '{parcel_id}' tidak ditemukan pada petak '{field_id}'."
            }
        )
    return create_envelope(updated_parcel.model_dump())

@router.post("/{field_id}/simulate-dropout")
def simulate_node_dropout_alias(
    field_id: str,
    req: SimulateFailoverRequestDTO
):
    """
    Alias endpoint for node dropout simulation.
    """
    parcel_id = "A1"
    updated_parcel = db.toggle_parcel_failover(
        field_id=field_id,
        parcel_id=parcel_id,
        is_dropout=req.is_dropout
    )
    return create_envelope(updated_parcel.model_dump() if updated_parcel else {})


