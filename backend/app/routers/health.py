import time
from fastapi import APIRouter
from app.schemas.envelope import create_envelope
from app.services.mock_db import db

router = APIRouter(tags=["Health"])

START_TIME = time.time()

@router.get("/health")
def health_check():
    uptime = round(time.time() - START_TIME, 1)
    nodes = db.list_nodes()
    return create_envelope({
        "status": "healthy",
        "service": "VolatiSafe AIoT Central Orchestrator",
        "version": "v1.0",
        "uptime_sec": uptime,
        "nodes_registered": len(nodes),
        "database_connected": True,
        "ai_engine_ready": True
    })
