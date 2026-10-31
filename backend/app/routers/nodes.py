from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session
from app.schemas.envelope import create_envelope
from app.schemas.nodes import (
    NodeDTO,
    NodeCreateDTO,
    TelemetryPointDTO,
    NodeTelemetrySeriesDTO,
    BoMResponseDTO
)
from app.core.database import get_db
from app.models.node import NodeModel
from app.models.telemetry import TelemetryModel
from app.services.mock_db import db

router = APIRouter(prefix="/nodes", tags=["Nodes"])

@router.get("")
def list_nodes(
    field_id: Optional[str] = Query(None, description="Filter berdasarkan ID petak"),
    session: Session = Depends(get_db)
):
    """
    Mengambil daftar seluruh node sensor LoRa aktif beserta telemetri live,
    diagnostik sinyal RF (RSSI, SNR, Packet Loss), dan status baterai.
    """
    nodes = db.list_nodes(field_id=field_id)
    return create_envelope([n.model_dump() for n in nodes])

@router.post("", status_code=status.HTTP_201_CREATED)
def register_node(
    payload: NodeCreateDTO,
    session: Session = Depends(get_db)
):
    """
    Mendaftarkan node sensor baru ke sistem, menyimpan metadata ke TimescaleDB,
    dan mengalokasikan parameter RF LoRa awal.
    """
    existing = db.get_node(payload.node_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "NODE_ALREADY_EXISTS",
                "message": f"Node dengan ID '{payload.node_id}' sudah terdaftar di sistem."
            }
        )

    try:
        node_row = NodeModel(
            node_id=payload.node_id,
            field_id=payload.field_id,
            firmware_ver=payload.firmware_ver or "v1.0.2-prod",
            battery_v=4.15,
            last_seen=datetime.now(timezone.utc)
        )
        session.add(node_row)
        session.commit()
    except Exception:
        pass

    created = db.register_node(payload)
    return create_envelope(created.model_dump())


@router.get("/bom")
def get_nodes_bom():
    """
    Mengambil rincian biaya perangkat (Bill of Materials / BoM Rp 449.000)
    dan pemetaan pin ESP32 untuk node sensor LoRa.
    """
    bom_data = db.get_hardware_bom()
    return create_envelope(bom_data.model_dump())

@router.get("/{node_id}/telemetry")
def get_node_telemetry(
    node_id: str,
    hours: int = Query(24, ge=1, le=168, description="Rentang jam historis (default 24, max 168)"),
    session: Session = Depends(get_db)
):
    try:
        since_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        rows = (
            session.query(TelemetryModel)
            .filter(TelemetryModel.node_id == node_id)
            .filter(TelemetryModel.ts >= since_time)
            .order_by(TelemetryModel.ts.asc())
            .all()
        )
        if rows:
            series = [
                TelemetryPointDTO(
                    timestamp=r.ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    moisture_pct=float(r.moisture or 0.0),
                    soil_temp_c=float(r.soil_temp or 0.0),
                    ph=float(r.ph or 7.0),
                    battery_voltage=float(r.battery_v or 3.87),
                    is_predicted=bool(r.is_predicted)
                )
                for r in rows
            ]
            return create_envelope(NodeTelemetrySeriesDTO(
                node_id=node_id,
                hours_requested=hours,
                points_count=len(series),
                series=series
            ).model_dump())
    except Exception:
        pass

    # Fallback
    series = db.get_node_telemetry(node_id=node_id, hours=hours)
    if not series:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NODE_NOT_FOUND",
                "message": f"Node dengan ID '{node_id}' tidak ditemukan di sistem."
            }
        )
    return create_envelope(series.model_dump())
