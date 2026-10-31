from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from app.schemas.simulation import WhatIfRequestDTO
from app.schemas.envelope import create_envelope
from app.services.ai_service import AIService
from app.services.ingestion import IngestionService
from app.routers.websocket import ws_manager

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/what-if")
def simulate_what_if(req: WhatIfRequestDTO):
    prediction = AIService.predict_avri(req)
    return create_envelope(prediction.model_dump())

@router.post("/inject-telemetry")
async def inject_simulated_telemetry(payload: Dict[str, Any]):
    """
    Menyimulasikan transmisi paket LoRa baru, menyimpannya ke database TimescaleDB,
    menghitung prediksi PIML, dan mem-broadcast event TELEMETRY_UPDATE via WebSocket /ws/v1/live.
    """
    # Dukung format kompak LoRa (n, m, t, ph, b) maupun format ekspansif (node_id, moisture_pct, soil_temp_c, ph, battery_voltage)
    compact_payload = {
        "n": payload.get("n") or payload.get("node_id", "VS-A1-003"),
        "m": payload.get("m") if payload.get("m") is not None else payload.get("moisture_pct", 24.5),
        "t": payload.get("t") if payload.get("t") is not None else payload.get("soil_temp_c", 29.5),
        "ph": payload.get("ph") if payload.get("ph") is not None else 7.82,
        "b": payload.get("b") if payload.get("b") is not None else payload.get("battery_voltage", 3.88),
        "ts": payload.get("ts")
    }

    res = IngestionService.process_lora_payload(compact_payload)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_TELEMETRY",
                "message": "Payload telemetri tidak valid atau berada di luar rentang sensor fisik."
            }
        )

    t_data = res.get("telemetry", {})
    p_data = res.get("prediction", {})
    ws_payload = {
        "node_id": res.get("node_id"),
        "field_id": res.get("field_id", "BLOK-A"),
        "timestamp": t_data.get("timestamp"),
        "moisture_pct": t_data.get("moisture_pct"),
        "soil_temp_c": t_data.get("soil_temp_c"),
        "ph": t_data.get("ph"),
        "avri_score": p_data.get("avri_score"),
        "risk_category": p_data.get("risk_category"),
        "is_predicted": t_data.get("is_predicted", False),
        "telemetry": t_data,
        "prediction": p_data,
        "alert": res.get("alert")
    }

    # Broadcast ke seluruh klien WebSocket yang tersambung
    await ws_manager.broadcast({
        "event": "TELEMETRY_UPDATE",
        "data": ws_payload
    })

    if res.get("alert"):
        await ws_manager.broadcast({
            "event": "ALERT_TRIGGERED",
            "data": res.get("alert")
        })

    return create_envelope(ws_payload)

