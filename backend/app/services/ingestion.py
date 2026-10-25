from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.schemas.nodes import TelemetryPointDTO
from app.schemas.simulation import WhatIfRequestDTO
from app.services.ai_service import AIService
from app.services.mock_db import db
from app.services.alert_dispatcher import alert_dispatcher

class IngestionService:
    """
    Ingestion Pipeline & Anti-Corruption Adapter (INTERFACES.md §1 & TASK_GUIDE.md §BE-1.4).
    Menerjemahkan payload LoRa mentah, membersihkan data, dan memicu AI engine.
    """

    @classmethod
    def process_lora_payload(cls, raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # 1. Ekstraksi field kompak LoRa: n, ts, m, t, ph, b
        node_id = raw.get("n")
        ts = raw.get("ts")
        moisture = raw.get("m")
        temp = raw.get("t")
        ph = raw.get("ph")
        battery = raw.get("b", 3.87)

        if not node_id or moisture is None or temp is None or ph is None:
            return None

        # 2. Validasi rentang fisik (Data Cleaning)
        if not (-10.0 <= temp <= 60.0):
            return None
        if not (0.0 <= moisture <= 100.0):
            return None
        if not (3.0 <= ph <= 10.0):
            return None

        # 3. Konversi timestamp unix ke ISO UTC
        if ts:
            try:
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
                iso_time = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except Exception:
                iso_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            iso_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 4. Simpan ke database deret waktu
        point = TelemetryPointDTO(
            timestamp=iso_time,
            moisture_pct=round(float(moisture), 1),
            soil_temp_c=round(float(temp), 1),
            ph=round(float(ph), 2),
            battery_voltage=round(float(battery), 2),
            is_predicted=False
        )
        db.record_telemetry(node_id, point)

        # 5. Picu pemanggilan AI Predictor (PIML)
        pred_req = WhatIfRequestDTO(
            soil_temp_c=point.soil_temp_c,
            moisture_pct=point.moisture_pct,
            ph=point.ph,
            rain_mm=0.0
        )
        pred_res = AIService.predict_avri(pred_req)

        # 6. Jika AVRI >= 61% (Kritis/Bahaya), picu AlertDispatcher
        alert_result = None
        if pred_res.avri_score >= 61.0:
            alert_result = alert_dispatcher.dispatch_critical_alert(
                field_id="BLOK-A",
                field_name="Kebun Jagung Pak Suparman · Blok A",
                avri_score=pred_res.avri_score,
                soil_temp_c=point.soil_temp_c,
                moisture_pct=point.moisture_pct,
                ph=point.ph
            )

        return {
            "node_id": node_id,
            "field_id": "BLOK-A",
            "telemetry": point.model_dump(),
            "prediction": pred_res.model_dump(),
            "alert": alert_result
        }
