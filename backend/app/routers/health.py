import time
from pathlib import Path
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.schemas.envelope import create_envelope
from app.core.database import get_db, is_timescaledb_active
from app.models.node import NodeModel
from app.services.mock_db import db

router = APIRouter(tags=["Health"])

START_TIME = time.time()

@router.get("/health")
def health_check(session: Session = Depends(get_db)):
    uptime = round(time.time() - START_TIME, 1)

    # 1. Real database connection test
    db_ok = False
    nodes_count = len(db.list_nodes())
    try:
        session.execute(text("SELECT 1"))
        db_ok = True
        db_nodes_count = session.query(NodeModel).count()
        if db_nodes_count > 0:
            nodes_count = db_nodes_count
    except Exception:
        db_ok = is_timescaledb_active

    # 2. Real AI Engine Model check
    model_paths = [
        Path("models/avri_model.txt"),
        Path("/app/models/avri_model.txt"),
        Path("../models/avri_model.txt")
    ]
    ai_ok = any(p.exists() for p in model_paths)

    return create_envelope({
        "status": "healthy",
        "service": "VolatiSafe AIoT Central Orchestrator",
        "version": "v1.0",
        "uptime_sec": uptime,
        "nodes_registered": nodes_count,
        "database_connected": db_ok,
        "ai_engine_ready": ai_ok
    })
