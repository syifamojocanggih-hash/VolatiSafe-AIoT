from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status, Depends
from sqlalchemy.orm import Session
from app.schemas.envelope import create_envelope
from app.schemas.nodes import NodeDTO, TelemetryPointDTO, NodeTelemetrySeriesDTO
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
    try:
        query = session.query(NodeModel)
        if field_id:
            query = query.filter(NodeModel.field_id == field_id)
        db_nodes = query.all()
        if db_nodes:
            dtos: List[NodeDTO] = []
            for n in db_nodes:
                battery_pct = int(max(0, min(100, (float(n.battery_v or 3.0) - 3.0) / (4.2 - 3.0) * 100)))
                dtos.append(NodeDTO(
                    node_id=n.node_id,
                    field_id=n.field_id,
                    firmware_ver=n.firmware_ver,
                    battery_v=float(n.battery_v or 3.87),
                    battery_pct=battery_pct,
                    last_seen=n.last_seen.strftime("%Y-%m-%dT%H:%M:%SZ") if n.last_seen else "2026-10-24T16:00:00Z",
                    status="online"
                ))
            return create_envelope([d.model_dump() for d in dtos])
    except Exception:
        pass

    # Fallback to in-memory state
    nodes = db.list_nodes(field_id=field_id)
    return create_envelope([n.model_dump() for n in nodes])

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
            .order_by(TelemetryModel.ts.asc())
            .all()
        )
        if rows and len(rows) >= 24:
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
