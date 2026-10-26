from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.envelope import create_envelope
from app.services.mock_db import db

router = APIRouter(prefix="/nodes", tags=["Nodes"])

@router.get("")
def list_nodes(field_id: Optional[str] = Query(None, description="Filter berdasarkan ID petak")):
    nodes = db.list_nodes(field_id=field_id)
    return create_envelope([n.model_dump() for n in nodes])

@router.get("/{node_id}/telemetry")
def get_node_telemetry(
    node_id: str,
    hours: int = Query(24, ge=1, le=168, description="Rentang jam historis (default 24, max 168)")
):
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
