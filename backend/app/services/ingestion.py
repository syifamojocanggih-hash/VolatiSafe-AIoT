import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.schemas.nodes import TelemetryPointDTO
from app.schemas.simulation import WhatIfRequestDTO
from app.services.ai_service import AIService
from app.services.mock_db import db
from app.services.alert_dispatcher import alert_dispatcher

logger = logging.getLogger("volatisafe.ingestion")

DEFAULT_FIELD_ID = "BLOK-A"
SENSOR_ERROR_FLAG = -999.0

# Batas fisik sama dengan yang dipakai firmware (INTERFACES.md §1.2) supaya
# paket yang ditolak backend bisa dijelaskan dengan alasan yang sama.
CHANNEL_LIMITS = {
    "m": ("moisture", 0.0, 100.0),
    "t": ("suhu tanah", -10.0, 60.0),
    "ph": ("pH", 3.0, 10.0),
}


class IngestionService:
    """
    Ingestion Pipeline & Anti-Corruption Adapter (INTERFACES.md §1 & TASK_GUIDE.md §BE-1.4).
    Menerjemahkan payload LoRa mentah, membersihkan data, dan memicu AI engine.
    """

    @staticmethod
    def _parse_timestamp(ts: Any) -> datetime:
        if isinstance(ts, (int, float)) and ts >= 1_700_000_000:
            try:
                return datetime.fromtimestamp(ts, tz=timezone.utc)
            except (OverflowError, OSError, ValueError):
                pass
        return datetime.now(timezone.utc)

    @classmethod
    def _reject_reason(cls, raw: Dict[str, Any]) -> Optional[str]:
        """Kembalikan alasan penolakan, atau None bila paket layak disimpan."""
        node_id = raw.get("n")
        if not node_id:
            return "field 'n' (node_id) kosong"

        for key, (label, low, high) in CHANNEL_LIMITS.items():
            value = raw.get(key)
            if value is None:
                return f"field '{key}' ({label}) kosong"
            try:
                value = float(value)
            except (TypeError, ValueError):
                return f"field '{key}' ({label}) bukan angka: {value!r}"
            if value == SENSOR_ERROR_FLAG:
                return f"{label} mengirim sentinel {SENSOR_ERROR_FLAG} (sensor rusak/kalibrasi gagal)"
            if not (low <= value <= high):
                return f"{label} di luar rentang {low}..{high}: {value}"
        return None

    @classmethod
    def process_lora_payload(cls, raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        reason = cls._reject_reason(raw)
        if reason:
            logger.warning(
                "Paket telemetri ditolak: %s | node=%s payload=%s",
                reason,
                raw.get("n"),
                raw,
            )
            return None

        node_id = str(raw["n"])
        dt = cls._parse_timestamp(raw.get("ts"))
        iso_time = dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        point = TelemetryPointDTO(
            timestamp=iso_time,
            moisture_pct=round(float(raw["m"]), 1),
            soil_temp_c=round(float(raw["t"]), 1),
            ph=round(float(raw["ph"]), 2),
            battery_voltage=round(float(raw.get("b", 3.87)), 2),
            is_predicted=False,
        )

        # Node yang belum terdaftar tetap diterima. Node baru dari lapangan tidak
        # boleh hilang hanya karena belum diinput lewat dashboard admin.
        db.ensure_node(node_id, field_id=DEFAULT_FIELD_ID)
        db.record_telemetry(node_id, point)

        pred_res = None
        try:
            pred_res = AIService.predict_avri(
                WhatIfRequestDTO(
                    soil_temp_c=point.soil_temp_c,
                    moisture_pct=point.moisture_pct,
                    ph=point.ph,
                    rain_mm=0.0,
                )
            )
        except Exception as exc:
            logger.warning("Inferensi AVRI gagal untuk node %s: %s", node_id, exc)

        try:
            cls._persist(node_id, dt, point, pred_res)
        except Exception as exc:
            logger.warning("Gagal menyimpan telemetri %s ke database: %s", node_id, exc)

        alert_result = None
        if pred_res is not None and pred_res.avri_score >= 61.0:
            alert_result = alert_dispatcher.dispatch_critical_alert(
                field_id=DEFAULT_FIELD_ID,
                field_name="Kebun Jagung Pak Suparman - Blok A",
                avri_score=pred_res.avri_score,
                soil_temp_c=point.soil_temp_c,
                moisture_pct=point.moisture_pct,
                ph=point.ph,
            )

        logger.info(
            "Telemetri diterima: node=%s ts=%s m=%.1f t=%.1f ph=%.2f b=%.2f avri=%s",
            node_id,
            iso_time,
            point.moisture_pct,
            point.soil_temp_c,
            point.ph,
            point.battery_voltage,
            f"{pred_res.avri_score:.1f}" if pred_res else "n/a",
        )

        return {
            "node_id": node_id,
            "field_id": DEFAULT_FIELD_ID,
            "telemetry": point.model_dump(),
            "prediction": pred_res.model_dump() if pred_res else None,
            "alert": alert_result,
        }

    @classmethod
    def _persist(cls, node_id: str, dt: datetime, point: TelemetryPointDTO, pred_res) -> None:
        from app.core.database import SessionLocal
        from app.models.field import FieldStateModel
        from app.models.node import NodeModel
        from app.models.prediction import PredictionModel
        from app.models.telemetry import TelemetryModel

        with SessionLocal() as session:
            session.add(
                TelemetryModel(
                    ts=dt,
                    node_id=node_id,
                    moisture=point.moisture_pct,
                    soil_temp=point.soil_temp_c,
                    ph=point.ph,
                    battery_v=point.battery_voltage,
                    is_predicted=False,
                )
            )

            node = session.query(NodeModel).filter(NodeModel.node_id == node_id).first()
            if node is None:
                session.add(
                    NodeModel(
                        node_id=node_id,
                        field_id=DEFAULT_FIELD_ID,
                        firmware_ver="1.0.0",
                        battery_v=point.battery_voltage,
                        last_seen=dt,
                    )
                )
            else:
                node.last_seen = dt
                node.battery_v = point.battery_voltage

            f_state = (
                session.query(FieldStateModel)
                .filter(FieldStateModel.field_id == DEFAULT_FIELD_ID)
                .first()
            )
            if f_state:
                f_state.updated_at = dt
                f_state.theta = point.moisture_pct
                f_state.t_soil = point.soil_temp_c
                f_state.ph = point.ph

            if pred_res is not None:
                session.add(
                    PredictionModel(
                        ts=dt,
                        field_id=DEFAULT_FIELD_ID,
                        avri_score=pred_res.avri_score,
                        risk_class=pred_res.risk_category,
                        shap_values=[s.model_dump() for s in pred_res.prescription.shap_explanations],
                        model_version=pred_res.model_meta.version,
                    )
                )

            session.commit()
