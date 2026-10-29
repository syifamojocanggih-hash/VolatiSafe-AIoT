import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, status, Depends, Query
from sqlalchemy.orm import Session
from app.schemas.agronomy import (
    FertilizerBlendRequestDTO,
    CropCycleCreateDTO,
    FertilizationLogCreateDTO,
    FertilizationLogResponseDTO,
)
from app.schemas.simulation import WhatIfRequestDTO
from app.schemas.envelope import create_envelope
from app.core.database import get_db
from app.models.crop_cycle import CropCycleModel, FertilizationLogModel
from app.models.field import FieldStateModel
from app.services.agronomy_service import AgronomyService
from app.services.ai_service import AIService
from app.services.mock_db import db

router = APIRouter(tags=["Agronomy"])

@router.post("/fertilizer/blend-calculator")
def calculate_blend(req: FertilizerBlendRequestDTO):
    blend_response = AgronomyService.calculate_blend(req)
    return create_envelope(blend_response.model_dump())

@router.get("/crop-cycles")
def get_active_crop_cycle(
    field_id: str = Query("BLOK-A", description="ID petak sawah"),
    session: Session = Depends(get_db)
):
    """
    Mengambil data siklus tanam aktif lengkap dengan model Gantt Chart fenologi real-time.
    """
    cycle_rec = (
        session.query(CropCycleModel)
        .filter(CropCycleModel.field_id == field_id)
        .filter(CropCycleModel.status == "active")
        .order_by(CropCycleModel.created_at.desc())
        .first()
    )

    if cycle_rec:
        planting_date_str = cycle_rec.planting_date.isoformat()
        variety = cycle_rec.corn_variety
        area = 0.75
        yield_target = float(cycle_rec.target_yield_ton_ha or 8.0)
    else:
        # Default baseline dari DB awal
        planting_date_str = "2026-09-25"
        variety = "Hibrida Bisi-18"
        area = 0.75
        yield_target = 8.0

    req = CropCycleCreateDTO(
        field_id=field_id,
        planting_date=planting_date_str,
        seed_variety=variety,
        field_area_ha=area,
        target_yield_ton_ha=yield_target
    )
    cycle_response = AgronomyService.calculate_crop_cycle(req)
    return create_envelope(cycle_response.model_dump())

@router.post("/crop-cycles", status_code=status.HTTP_201_CREATED)
def create_crop_cycle(req: CropCycleCreateDTO, session: Session = Depends(get_db)):
    cycle_response = AgronomyService.calculate_crop_cycle(req)
    try:
        # Non-aktifkan siklus lama untuk field yang sama jika ada
        session.query(CropCycleModel).filter(
            CropCycleModel.field_id == req.field_id,
            CropCycleModel.status == "active"
        ).update({"status": "archived"})

        cycle_model = CropCycleModel(
            cycle_id=cycle_response.cycle_id,
            field_id=req.field_id,
            planting_date=datetime.strptime(req.planting_date, "%Y-%m-%d").date(),
            corn_variety=req.seed_variety,
            target_yield_ton_ha=req.target_yield_ton_ha,
            status="active"
        )
        session.add(cycle_model)

        # Update umur DAT pada FieldStateModel
        f_state = session.query(FieldStateModel).filter(FieldStateModel.field_id == req.field_id).first()
        if f_state:
            f_state.dat = cycle_response.current_dat
            f_state.updated_at = datetime.now(timezone.utc)

        session.commit()
    except Exception:
        session.rollback()

    db.save_crop_cycle(cycle_response)
    return create_envelope(cycle_response.model_dump())

@router.post("/fertilizer/logs", status_code=status.HTTP_201_CREATED)
def record_fertilization_log(req: FertilizationLogCreateDTO, session: Session = Depends(get_db)):
    """
    Mencatat data pemupukan nyata petani ke TimescaleDB (fertilization_logs),
    memperbarui last_urea_kg dan kalibrasi pH tanah pada Digital Twin (field_state).
    """
    log_id = str(uuid.uuid4())

    # Parse applied_at
    if req.applied_at:
        try:
            if "T" in req.applied_at:
                applied_dt = datetime.fromisoformat(req.applied_at.replace("Z", "+00:00"))
            else:
                applied_dt = datetime.strptime(req.applied_at, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            applied_dt = datetime.now(timezone.utc)
    else:
        applied_dt = datetime.now(timezone.utc)

    # Determine AVRI at time
    avri_score = req.avri_at_time
    if avri_score is None:
        try:
            state_rec = session.query(FieldStateModel).filter(FieldStateModel.field_id == req.field_id).first()
            if state_rec:
                pred = AIService.predict_avri(WhatIfRequestDTO(
                    soil_temp_c=float(state_rec.t_soil),
                    moisture_pct=float(state_rec.theta),
                    ph=float(state_rec.ph),
                    rain_mm=0.0
                ))
                avri_score = pred.avri_score
            else:
                avri_score = 18.0
        except Exception:
            avri_score = 18.0

    # Total and bucket measures
    total_kg = round(req.urea_kg + req.npk_phonska_kg + req.za_kg, 1)
    buckets_count = int(round(total_kg / 8.0)) if total_kg > 0 else 0

    parts = []
    if req.urea_kg > 0:
        parts.append(f"{req.urea_kg:g} kg Urea")
    if req.npk_phonska_kg > 0:
        parts.append(f"{req.npk_phonska_kg:g} kg NPK Phonska")
    if req.za_kg > 0:
        parts.append(f"{req.za_kg:g} kg ZA")
    mixture_summary = req.notes or (" + ".join(parts) + f" ({buckets_count} Ember)" if parts else "0 kg Pupuk")

    status_text = "Optimal (Aman)" if avri_score <= 30 else ("Waspada" if avri_score <= 60 else "Kritis")

    # Persist log model
    log_row = FertilizationLogModel(
        log_id=log_id,
        field_id=req.field_id,
        applied_at=applied_dt,
        stage_name=req.stage_name[:64],
        urea_kg=req.urea_kg,
        npk_phonska_kg=req.npk_phonska_kg,
        za_kg=req.za_kg,
        avri_at_time=avri_score,
        notes=mixture_summary
    )

    try:
        session.add(log_row)

        # Update FieldStateModel for Digital Twin calibration
        state_rec = session.query(FieldStateModel).filter(FieldStateModel.field_id == req.field_id).first()
        if state_rec:
            state_rec.last_urea_kg = req.urea_kg
            # Slow acidification correction: pH(t+1) = pH(t) - 0.002 * N_applied
            n_applied = (req.urea_kg * 0.46) + (req.za_kg * 0.21)
            if n_applied > 0:
                ph_drop = min(0.3, max(0.01, 0.002 * n_applied))
                state_rec.ph = max(5.0, round(float(state_rec.ph) - ph_drop, 2))
            state_rec.updated_at = datetime.now(timezone.utc)

        session.commit()
    except Exception:
        session.rollback()

    dto = FertilizationLogResponseDTO(
        log_id=log_id,
        field_id=req.field_id,
        applied_at=applied_dt.isoformat(),
        date_str=applied_dt.strftime("%d/%m/%Y"),
        stage_name=req.stage_name,
        hst=req.hst or 30,
        urea_kg=req.urea_kg,
        npk_phonska_kg=req.npk_phonska_kg,
        za_kg=req.za_kg,
        total_kg=total_kg,
        buckets_count=buckets_count,
        mixture_summary=mixture_summary,
        avri_at_time=avri_score,
        status_text=status_text,
        notes=req.notes
    )
    return create_envelope(dto.model_dump())

@router.get("/fertilizer/logs")
def get_fertilization_logs(
    field_id: str = Query("BLOK-A", description="ID petak sawah"),
    session: Session = Depends(get_db)
):
    """
    Mengambil daftar riwayat catatan pemupukan nyata dari TimescaleDB.
    """
    # Fetch rows where stage_name is not action tokens and total fertilizer is recorded
    records = (
        session.query(FertilizationLogModel)
        .filter(FertilizationLogModel.field_id == field_id)
        .filter(~FertilizationLogModel.stage_name.startswith("TUNDA"))
        .filter(~FertilizationLogModel.stage_name.startswith("BATAL"))
        .filter(~FertilizationLogModel.stage_name.startswith("NOTIF"))
        .order_by(FertilizationLogModel.applied_at.desc())
        .all()
    )

    # If no records exist yet, seed initial baseline Fase V3 log
    if not records:
        initial_log = FertilizationLogModel(
            log_id=str(uuid.uuid4()),
            field_id=field_id,
            applied_at=datetime(2026, 10, 7, 6, 30, tzinfo=timezone.utc),
            stage_name="Fase V3 (Pemupukan Dasar)",
            urea_kg=38.0,
            npk_phonska_kg=112.0,
            za_kg=0.0,
            avri_at_time=21.0,
            notes="112 kg Phonska + 38 kg Urea (19 Ember)"
        )
        try:
            session.add(initial_log)
            session.commit()
            records = [initial_log]
        except Exception:
            session.rollback()

    results: List[FertilizationLogResponseDTO] = []
    for r in records:
        u = float(r.urea_kg or 0.0)
        n = float(r.npk_phonska_kg or 0.0)
        z = float(r.za_kg or 0.0)
        tot = round(u + n + z, 1)
        b = int(round(tot / 8.0)) if tot > 0 else 0
        avri = float(r.avri_at_time or 20.0)
        st = "Optimal (Aman)" if avri <= 30 else ("Waspada" if avri <= 60 else "Kritis")
        
        # Calculate approximate HST from applied_at if possible
        hst_est = max(10, min(120, int((r.applied_at.date() - datetime(2026, 9, 25).date()).days)))

        results.append(
            FertilizationLogResponseDTO(
                log_id=r.log_id,
                field_id=r.field_id or field_id,
                applied_at=r.applied_at.isoformat(),
                date_str=r.applied_at.strftime("%d/%m/%Y"),
                stage_name=r.stage_name,
                hst=hst_est,
                urea_kg=u,
                npk_phonska_kg=n,
                za_kg=z,
                total_kg=tot,
                buckets_count=b,
                mixture_summary=r.notes or f"{u:g} kg Urea + {n:g} kg NPK Phonska ({b} Ember)",
                avri_at_time=avri,
                status_text=st,
                notes=r.notes
            )
        )

    return create_envelope([item.model_dump() for item in results])
