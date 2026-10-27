import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from app.schemas.nodes import NodeDTO, TelemetryPointDTO, NodeTelemetrySeriesDTO
from app.schemas.fields import (
    FieldCurrentStatusDTO,
    FieldMetricsDTO,
    AlertBannerDTO,
    ForecastWindowDTO,
    ForecastWindowItemDTO,
    ShapExplanationDTO,
    FarmerActionRequestDTO,
    FarmerActionResponseDTO
)
from app.schemas.agronomy import CropCycleResponseDTO

class MockDB:
    """
    In-memory state and data access layer initialized with seed fixtures
    from INTERFACES.md and MOCK_DATA.md.
    """
    
    def __init__(self):
        self._nodes: Dict[str, NodeDTO] = {}
        self._telemetry_series: Dict[str, List[TelemetryPointDTO]] = {}
        self._fields: Dict[str, Dict[str, Any]] = {}
        self._crop_cycles: Dict[str, CropCycleResponseDTO] = {}
        self._seed_data()
        
    def _seed_data(self):
        # 1. Master Nodes
        self._nodes["VS-A1-003"] = NodeDTO(
            node_id="VS-A1-003",
            field_id="BLOK-A",
            firmware_ver="v1.0.2-prod",
            battery_v=3.87,
            battery_pct=84,
            last_seen="2026-10-24T16:00:00Z",
            status="online"
        )
        self._nodes["VS-A2-001"] = NodeDTO(
            node_id="VS-A2-001",
            field_id="BLOK-B",
            firmware_ver="v1.0.2-prod",
            battery_v=3.95,
            battery_pct=92,
            last_seen="2026-10-24T16:00:00Z",
            status="online"
        )
        
        # 2. Historical 24h Telemetry for VS-A1-003 (MOCK_DATA.md §2)
        self._telemetry_series["VS-A1-003"] = [
            TelemetryPointDTO(timestamp="2026-10-24T00:00:00Z", moisture_pct=25.1, soil_temp_c=26.2, ph=7.81, battery_voltage=3.90, is_predicted=False),
            TelemetryPointDTO(timestamp="2026-10-24T03:00:00Z", moisture_pct=24.8, soil_temp_c=25.4, ph=7.81, battery_voltage=3.89, is_predicted=False),
            TelemetryPointDTO(timestamp="2026-10-24T06:00:00Z", moisture_pct=24.5, soil_temp_c=26.8, ph=7.82, battery_voltage=3.89, is_predicted=False),
            TelemetryPointDTO(timestamp="2026-10-24T09:00:00Z", moisture_pct=23.7, soil_temp_c=31.0, ph=7.82, battery_voltage=3.92, is_predicted=False),
            TelemetryPointDTO(timestamp="2026-10-24T12:00:00Z", moisture_pct=22.8, soil_temp_c=34.6, ph=7.83, battery_voltage=3.94, is_predicted=False),
            TelemetryPointDTO(timestamp="2026-10-24T14:00:00Z", moisture_pct=22.5, soil_temp_c=34.8, ph=7.83, battery_voltage=3.91, is_predicted=False),
            TelemetryPointDTO(timestamp="2026-10-24T15:00:00Z", moisture_pct=22.4, soil_temp_c=34.3, ph=7.83, battery_voltage=3.88, is_predicted=False),
            TelemetryPointDTO(timestamp="2026-10-24T16:00:00Z", moisture_pct=22.4, soil_temp_c=34.1, ph=7.83, battery_voltage=3.87, is_predicted=False),
        ]
        
        # 3. Master Fields
        self._fields["BLOK-A"] = {
            "field_id": "BLOK-A",
            "field_name": "Kebun Jagung Pak Suparman · Blok A",
            "owner_name": "Pak Suparman",
            "owner_phone": "+6281234567890",
            "area_ha": 0.75,
            "soil_type": "clay_alkaline",
            "primary_node_id": "VS-A1-003",
            "last_updated": "2026-10-24T16:00:00Z",
            "is_simulated_failover": False,
            "is_postponed": False,
            "postponed_at": None,
            "last_action": None,
            "action_history": [],
            "metrics": {
                "moisture_pct": 22.4,
                "moisture_delta_24h": -3.2,
                "soil_temp_c": 34.1,
                "soil_temp_delta_24h": 1.8,
                "ph": 7.83,
                "ph_delta_24h": -0.02,
                "avri_score": 74.0,
                "avri_category": "kritis"
            },
            "alert_banner": {
                "level": "kritis",
                "color": "#EA580C",
                "headline": "RISIKO KRITIS — AVRI 74%",
                "subheadline": "Jangan tabur Urea sekarang. Potensi penguapan amonia tinggi.",
                "best_window": "Besok Pagi, 06:00 – 09:00 WIB (Risiko 18%)"
            },
            "shap_explanations": [
                {
                    "feature": "soil_temp_c",
                    "label": "Suhu Tanah Panas (34.1°C)",
                    "impact_pct": 38.5,
                    "direction": "increases_risk",
                    "explanation": "Suhu tanah sangat terik (34.1°C) memicu penguraian cepat enzim urease"
                },
                {
                    "feature": "moisture_pct",
                    "label": "Tanah Kering (22.4%)",
                    "impact_pct": 26.0,
                    "direction": "increases_risk",
                    "explanation": "Tanah terlalu kering (22.4%), butiran Urea tidak dapat larut ke perakaran"
                },
                {
                    "feature": "ph",
                    "label": "pH Tanah Basa (7.83)",
                    "impact_pct": 9.7,
                    "direction": "increases_risk",
                    "explanation": "Tanah berkapur/basa (pH 7.83) mempercepat pelepasan gas amonia bebas"
                }
            ]
        }

    def list_nodes(self, field_id: Optional[str] = None) -> List[NodeDTO]:
        if field_id:
            return [n for n in self._nodes.values() if n.field_id == field_id]
        return list(self._nodes.values())

    def get_node(self, node_id: str) -> Optional[NodeDTO]:
        return self._nodes.get(node_id)

    def get_node_telemetry(self, node_id: str, hours: int = 24) -> Optional[NodeTelemetrySeriesDTO]:
        if node_id not in self._telemetry_series:
            return None
        series = self._telemetry_series[node_id]
        return NodeTelemetrySeriesDTO(
            node_id=node_id,
            hours_requested=hours,
            points_count=len(series),
            series=series
        )

    def get_field_status(self, field_id: str) -> Optional[FieldCurrentStatusDTO]:
        field = self._fields.get(field_id)
        if not field:
            return None
        
        node = self.get_node(field["primary_node_id"])
        battery_pct = node.battery_pct if node else 84

        shap_dtos = [ShapExplanationDTO(**s) for s in field["shap_explanations"]]

        return FieldCurrentStatusDTO(
            field_id=field["field_id"],
            field_name=field["field_name"],
            last_updated=field["last_updated"],
            battery_pct=battery_pct,
            is_simulated_failover=field.get("is_simulated_failover", False),
            is_postponed=field.get("is_postponed", False),
            postponed_at=field.get("postponed_at"),
            last_action=field.get("last_action"),
            metrics=FieldMetricsDTO(**field["metrics"]),
            alert_banner=AlertBannerDTO(**field["alert_banner"]),
            shap_explanations=shap_dtos
        )

    def get_forecast_window(self, field_id: str, hours: int = 72) -> Optional[ForecastWindowDTO]:
        if field_id not in self._fields:
            return None

        windows = [
            ForecastWindowItemDTO(
                timestamp_start="2026-10-24T18:00:00Z",
                timestamp_end="2026-10-24T21:00:00Z",
                avri_score=45.0,
                risk_category="waspada",
                is_safe=False
            ),
            ForecastWindowItemDTO(
                timestamp_start="2026-10-24T21:00:00Z",
                timestamp_end="2026-10-25T00:00:00Z",
                avri_score=38.0,
                risk_category="waspada",
                is_safe=False
            ),
            ForecastWindowItemDTO(
                timestamp_start="2026-10-25T00:00:00Z",
                timestamp_end="2026-10-25T03:00:00Z",
                avri_score=28.0,
                risk_category="aman",
                is_safe=True
            ),
            ForecastWindowItemDTO(
                timestamp_start="2026-10-25T03:00:00Z",
                timestamp_end="2026-10-25T06:00:00Z",
                avri_score=22.0,
                risk_category="aman",
                is_safe=True
            ),
            ForecastWindowItemDTO(
                timestamp_start="2026-10-25T06:00:00Z",
                timestamp_end="2026-10-25T09:00:00Z",
                avri_score=18.5,
                risk_category="aman",
                is_safe=True
            ),
            ForecastWindowItemDTO(
                timestamp_start="2026-10-25T09:00:00Z",
                timestamp_end="2026-10-25T12:00:00Z",
                avri_score=68.0,
                risk_category="kritis",
                is_safe=False
            ),
            ForecastWindowItemDTO(
                timestamp_start="2026-10-25T12:00:00Z",
                timestamp_end="2026-10-25T15:00:00Z",
                avri_score=78.2,
                risk_category="kritis",
                is_safe=False
            )
        ]

        return ForecastWindowDTO(
            field_id=field_id,
            forecast_hours=hours,
            windows=windows
        )

    def record_telemetry(self, node_id: str, point: TelemetryPointDTO):
        if node_id not in self._telemetry_series:
            self._telemetry_series[node_id] = []
        self._telemetry_series[node_id].append(point)
        # Update node status
        if node_id in self._nodes:
            self._nodes[node_id].last_seen = point.timestamp
            self._nodes[node_id].battery_v = point.battery_voltage
            pct = int(max(0, min(100, (point.battery_voltage - 3.0) / (4.2 - 3.0) * 100)))
            self._nodes[node_id].battery_pct = pct

    def save_crop_cycle(self, cycle: CropCycleResponseDTO):
        self._crop_cycles[cycle.cycle_id] = cycle

    def record_farmer_action(
        self,
        field_id: str,
        action: str,
        reason: Optional[str] = "AVRI_RISK_HIGH",
        notes: Optional[str] = None,
        urea_kg: float = 0.0,
        npk_kg: float = 0.0
    ) -> Optional[FarmerActionResponseDTO]:
        field = self._fields.get(field_id)
        if not field:
            return None

        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        action_id = f"act-{uuid.uuid4().hex[:8]}"

        action_lower = action.lower()
        is_postponing = action_lower in ["postpone", "tunda", "delay"]
        is_cancelling = action_lower in ["cancel", "resume", "batal", "cancel_postpone"]

        if is_postponing:
            field["is_postponed"] = True
            field["postponed_at"] = now_iso
            field["last_action"] = "postpone"
            status_msg = f"Aplikasi Urea pada {field['field_name']} berhasil ditunda. Sistem memantau jendela aman berikutnya."
            stage_name = "TUNDA_APLIKASI"
        elif is_cancelling:
            field["is_postponed"] = False
            field["postponed_at"] = None
            field["last_action"] = "cancel_postpone"
            status_msg = f"Penundaan pemupukan pada {field['field_name']} dibatalkan."
            stage_name = "BATAL_TUNDA"
        else:
            field["last_action"] = action_lower
            status_msg = f"Tindakan '{action}' berhasil dicatat di sistem."
            stage_name = action.upper()

        action_record = {
            "action_id": action_id,
            "field_id": field_id,
            "action": action,
            "is_postponed": field["is_postponed"],
            "status_message": status_msg,
            "recorded_at": now_iso,
            "next_safe_window": field.get("alert_banner", {}).get("best_window", "Besok 06:00 – 09:00 WIB"),
            "avri_at_action": field.get("metrics", {}).get("avri_score", 74.0),
            "reason": reason,
            "notes": notes
        }

        if "action_history" not in field:
            field["action_history"] = []
        field["action_history"].insert(0, action_record)

        # Persist to PostgreSQL / TimescaleDB if engine is active
        try:
            from app.core.database import SessionLocal
            from app.models.crop_cycle import FertilizationLogModel
            with SessionLocal() as session:
                log = FertilizationLogModel(
                    log_id=action_id,
                    field_id=field_id,
                    applied_at=datetime.now(timezone.utc),
                    stage_name=stage_name,
                    urea_kg=urea_kg,
                    npk_phonska_kg=npk_kg,
                    za_kg=0.0,
                    avri_at_time=field.get("metrics", {}).get("avri_score", 74.0),
                    notes=notes or f"{reason or 'Aksi Petani'} | {status_msg}"
                )
                session.add(log)
                session.commit()
        except Exception:
            pass

        return FarmerActionResponseDTO(
            action_id=action_id,
            field_id=field_id,
            action=action,
            is_postponed=field["is_postponed"],
            status_message=status_msg,
            recorded_at=now_iso,
            next_safe_window=action_record["next_safe_window"],
            avri_at_action=action_record["avri_at_action"]
        )

    def get_farmer_action_status(self, field_id: str) -> Optional[Dict[str, Any]]:
        field = self._fields.get(field_id)
        if not field:
            return None
        return {
            "field_id": field_id,
            "is_postponed": field.get("is_postponed", False),
            "postponed_at": field.get("postponed_at"),
            "last_action": field.get("last_action"),
            "next_safe_window": field.get("alert_banner", {}).get("best_window"),
            "recent_history": field.get("action_history", [])[:5]
        }

db = MockDB()
