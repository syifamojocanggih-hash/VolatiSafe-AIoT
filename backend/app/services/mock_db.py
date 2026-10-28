import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from app.schemas.nodes import NodeDTO, TelemetryPointDTO, NodeTelemetrySeriesDTO, BoMItemDTO, BoMResponseDTO
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
from app.schemas.simulation import PhysicsDiagnosticsDTO
from app.schemas.agronomy import CropCycleResponseDTO
from app.schemas.parcels import (
    BedengParcelDTO,
    SurroundingParcelDTO,
    ParcelMapSummaryDTO,
    SatelliteMetadataDTO,
    FieldParcelsResponseDTO
)
from app.services.parcels_data import (
    BLURI_OUTER_BOUNDARY,
    BLURI_SURROUNDING_PARCELS,
    get_initial_12_bedeng_parcels,
    generate_geojson_feature_collection
)

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
        self._bedeng_parcels: Dict[str, List[BedengParcelDTO]] = {}
        self._seed_data()
        
    def _seed_data(self):
        # 1. Master Nodes (Enriched Telemetry & LoRa Diagnostics)
        self._nodes["VS-A1-001"] = NodeDTO(
            node_id="VS-A1-001",
            field_id="BLOK-A",
            firmware_ver="v1.0.2-prod",
            battery_v=3.92,
            battery_pct=88,
            last_seen="2026-10-28T09:45:00Z",
            status="online",
            bedeng_location="Blok A1 (Utara Atas / Barat)",
            transmission_status="online",
            sleep_interval_text="Online · Sleep 15m",
            moisture_pct=22.4,
            soil_temp_c=34.1,
            ph=7.83,
            consumption_per_cycle="0,067 mAh/siklus",
            rssi_dbm=-82,
            snr_db=8.2,
            packet_loss_pct=0.4,
            timestamp_epoch=1792934400
        )
        self._nodes["VS-A1-002"] = NodeDTO(
            node_id="VS-A1-002",
            field_id="BLOK-A",
            firmware_ver="v1.0.2-prod",
            battery_v=4.01,
            battery_pct=94,
            last_seen="2026-10-28T09:45:00Z",
            status="online",
            bedeng_location="Blok A2 (Tengah Lembah / Inti 1)",
            transmission_status="online",
            sleep_interval_text="Online · Sleep 15m",
            moisture_pct=36.8,
            soil_temp_c=26.4,
            ph=7.10,
            consumption_per_cycle="0,067 mAh/siklus",
            rssi_dbm=-71,
            snr_db=9.5,
            packet_loss_pct=0.1,
            timestamp_epoch=1792934400
        )
        self._nodes["VS-A1-003"] = NodeDTO(
            node_id="VS-A1-003",
            field_id="BLOK-A",
            firmware_ver="v1.0.2-prod",
            battery_v=3.85,
            battery_pct=78,
            last_seen="2026-10-28T09:45:00Z",
            status="online",
            bedeng_location="Blok A3 (Timur / Sisi Jalan)",
            transmission_status="online",
            sleep_interval_text="Online · Sleep 15m",
            moisture_pct=19.2,
            soil_temp_c=36.0,
            ph=7.89,
            consumption_per_cycle="0,067 mAh/siklus",
            rssi_dbm=-79,
            snr_db=7.4,
            packet_loss_pct=0.8,
            timestamp_epoch=1792934400
        )
        self._nodes["VS-B1-004"] = NodeDTO(
            node_id="VS-B1-004",
            field_id="BLOK-A",
            firmware_ver="v1.0.2-prod",
            battery_v=3.98,
            battery_pct=91,
            last_seen="2026-10-28T09:45:00Z",
            status="online",
            bedeng_location="Blok B1 (Selatan Irigasi)",
            transmission_status="online",
            sleep_interval_text="Online · Sleep 15m",
            moisture_pct=41.2,
            soil_temp_c=26.8,
            ph=6.80,
            consumption_per_cycle="0,067 mAh/siklus",
            rssi_dbm=-68,
            snr_db=10.1,
            packet_loss_pct=0.0,
            timestamp_epoch=1792934400
        )
        self._nodes["VS-B2-005"] = NodeDTO(
            node_id="VS-B2-005",
            field_id="BLOK-A",
            firmware_ver="v1.0.2-prod",
            battery_v=3.55,
            battery_pct=62,
            last_seen="2026-10-28T09:45:00Z",
            status="offline_simulated",
            bedeng_location="Blok B2 (Lereng Selatan)",
            transmission_status="offline_simulated",
            sleep_interval_text="Offline → [Est-Simulated]",
            moisture_pct=28.5,
            soil_temp_c=30.2,
            ph=7.45,
            consumption_per_cycle="0,067 mAh/siklus",
            rssi_dbm=-94,
            snr_db=5.2,
            packet_loss_pct=1.2,
            timestamp_epoch=1792934400
        )
        
        # 2. Historical 24h Hourly Telemetry (00:00 - 23:00) for VS-A1-003 and others
        self._telemetry_series["VS-A1-003"] = self._generate_hourly_24h_telemetry("2026-10-24")
        
        # 3. Master Fields
        self._fields["BLOK-A"] = {
            "field_id": "BLOK-A",
            "field_name": "Kebun Jagung Pak Suparman - Blok A",
            "owner_name": "Pak Suparman",
            "owner_phone": "+6281234567890",
            "block": "Blok A",
            "area_ha": 0.75,
            "crop_age_days": 32,
            "crop_phase": "Fase 8 Vegetatif",
            "corn_variety": "BISI-18",
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

        # 4. Master 12 Bedeng Cadastral Parcels with UAV & Sentinel-2 Polygons
        self._bedeng_parcels["BLOK-A"] = get_initial_12_bedeng_parcels()

    def list_nodes(self, field_id: Optional[str] = None) -> List[NodeDTO]:
        if field_id:
            return [n for n in self._nodes.values() if n.field_id == field_id]
        return list(self._nodes.values())

    def get_node(self, node_id: str) -> Optional[NodeDTO]:
        return self._nodes.get(node_id)

    def register_node(self, payload) -> NodeDTO:
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        now_epoch = int(now_dt.timestamp())
        new_node = NodeDTO(
            node_id=payload.node_id,
            field_id=payload.field_id,
            firmware_ver=payload.firmware_ver or "v1.0.2-prod",
            battery_v=4.15,
            battery_pct=98,
            last_seen=now_iso,
            status="online",
            bedeng_location=payload.bedeng_location or "Blok B3 (Timur Selatan)",
            transmission_status="online",
            sleep_interval_text="Online · Sleep 15m",
            moisture_pct=35.0,
            soil_temp_c=27.5,
            ph=7.10,
            consumption_per_cycle="0,067 mAh/siklus",
            rssi_dbm=-65,
            snr_db=8.5,
            packet_loss_pct=0.2,
            timestamp_epoch=now_epoch
        )
        self._nodes[payload.node_id] = new_node
        return new_node



    def get_hardware_bom(self) -> BoMResponseDTO:
        items = [
            BoMItemDTO(
                id="moisture",
                component_name="Capacitive Moisture Sensor v1.2",
                pin_mapping="ADC1 GPIO34",
                price_idr=15000,
                category="Sensor Tanah"
            ),
            BoMItemDTO(
                id="ph",
                component_name="Soil pH Probe Industri + Modul Signal Conditioning",
                pin_mapping="ADC1 GPIO32",
                price_idr=62000,
                category="Sensor Tanah"
            ),
            BoMItemDTO(
                id="temp",
                component_name="Sensor Suhu DS18B20 Stainless Probe Waterproof",
                pin_mapping="1-Wire GPIO4",
                price_idr=18000,
                category="Sensor Tanah"
            ),
            BoMItemDTO(
                id="lora",
                component_name="Modul Transceiver LoRa SX1278 Ra-02 433 MHz",
                pin_mapping="SPI 5/18/19/23",
                price_idr=45000,
                category="Komunikasi Nirkabel"
            ),
            BoMItemDTO(
                id="esp32",
                component_name="Mikrokontroler ESP32 NodeMCU 30-Pin Ultra-Low Power",
                pin_mapping="Dual-Core 240MHz",
                price_idr=55000,
                category="Pemrosesan Komputasi"
            ),
            BoMItemDTO(
                id="solar",
                component_name="Panel Surya Monokristalin 5V 1W + Modul Charger TP4056",
                pin_mapping="Regulator VBUS",
                price_idr=45000,
                category="Sub-sistem Daya"
            ),
            BoMItemDTO(
                id="battery",
                component_name="Baterai Industri Li-Ion 18650 3.7V 2600mAh (High-Drain)",
                pin_mapping="JST-PH 2.0mm",
                price_idr=45000,
                category="Sub-sistem Daya"
            ),
            BoMItemDTO(
                id="enclosure",
                component_name="Enclosure Box IP65 Waterproof + Cable Gland PG7",
                pin_mapping="Weatherproof IP65",
                price_idr=55000,
                category="Proteksi Mekanikal"
            ),
            BoMItemDTO(
                id="power_switch",
                component_name="MOSFET AO3401A Gate Isolation Switch (Cegah Elektrolisis)",
                pin_mapping="GPIO25 Power Gate",
                price_idr=25000,
                category="Proteksi Elektronika"
            ),
            BoMItemDTO(
                id="calibration_kit",
                component_name="Kit Larutan Penyangga pH 4.00 & pH 7.00 + Kalibrator",
                pin_mapping="Lab Testing",
                price_idr=84000,
                category="Aksesoris & Kalibrasi"
            ),
        ]
        return BoMResponseDTO(
            total_cost_idr=449000,
            currency="IDR",
            phase_label="Paket Lengkap Kit Node Lapangan TKT-3 (IP65 + Dual Power + Kalibrator)",
            items=items
        )

    def get_node(self, node_id: str) -> Optional[NodeDTO]:
        return self._nodes.get(node_id)

    def _generate_hourly_24h_telemetry(self, base_date: str = "2026-10-24") -> List[TelemetryPointDTO]:
        """
        Generates 24 discrete hourly points (00:00 to 23:00) with realistic diurnal
        biophysical soil dynamics (FAO-56 evapotranspiration & Arrhenius thermal lag).
        """
        hourly_profiles = [
            # (hour, moisture_pct, soil_temp_c, ph, battery_v)
            (0, 26.5, 25.2, 7.81, 3.90),
            (1, 26.3, 24.8, 7.81, 3.89),
            (2, 26.0, 24.4, 7.81, 3.89),
            (3, 25.8, 24.0, 7.81, 3.89),
            (4, 25.6, 23.8, 7.81, 3.88),
            (5, 25.5, 24.1, 7.81, 3.88),
            (6, 25.2, 25.0, 7.82, 3.89),
            (7, 24.8, 26.8, 7.82, 3.90),
            (8, 24.2, 28.9, 7.82, 3.91),
            (9, 23.7, 31.0, 7.82, 3.92),
            (10, 23.2, 32.8, 7.83, 3.93),
            (11, 22.9, 34.0, 7.83, 3.94),
            (12, 22.8, 34.6, 7.83, 3.94),
            (13, 22.4, 35.1, 7.83, 3.93),
            (14, 22.5, 34.8, 7.83, 3.91),
            (15, 22.4, 34.3, 7.83, 3.88),
            (16, 22.8, 33.2, 7.83, 3.87),
            (17, 23.4, 30.8, 7.82, 3.87),
            (18, 24.1, 28.5, 7.82, 3.88),
            (19, 24.9, 27.2, 7.82, 3.88),
            (20, 25.4, 26.5, 7.81, 3.89),
            (21, 25.8, 26.0, 7.81, 3.89),
            (22, 26.1, 25.6, 7.81, 3.90),
            (23, 26.3, 25.4, 7.81, 3.90),
        ]
        return [
            TelemetryPointDTO(
                timestamp=f"{base_date}T{h:02d}:00:00Z",
                moisture_pct=m,
                soil_temp_c=t,
                ph=ph,
                battery_voltage=bv,
                is_predicted=False
            )
            for h, m, t, ph, bv in hourly_profiles
        ]

    def get_node_telemetry(self, node_id: str, hours: int = 24) -> Optional[NodeTelemetrySeriesDTO]:
        if node_id not in self._telemetry_series:
            self._telemetry_series[node_id] = self._generate_hourly_24h_telemetry()
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

        # Dynamic 24-hour delta calculation from telemetry series
        primary_node = field.get("primary_node_id", "VS-A1-003")
        series = self._telemetry_series.get(primary_node, [])
        metrics_dict = dict(field["metrics"])
        if len(series) >= 2:
            latest_pt = series[-1]
            ref_pt = series[0]
            metrics_dict["moisture_pct"] = latest_pt.moisture_pct
            metrics_dict["soil_temp_c"] = latest_pt.soil_temp_c
            metrics_dict["ph"] = latest_pt.ph
            metrics_dict["moisture_delta_24h"] = round(latest_pt.moisture_pct - ref_pt.moisture_pct, 1)
            metrics_dict["soil_temp_delta_24h"] = round(latest_pt.soil_temp_c - ref_pt.soil_temp_c, 1)
            metrics_dict["ph_delta_24h"] = round(latest_pt.ph - ref_pt.ph, 2)

        return FieldCurrentStatusDTO(
            field_id=field["field_id"],
            field_name=field["field_name"],
            farmer_name=field.get("owner_name", "Pak Suparman"),
            block=field.get("block", "Blok A"),
            area_ha=float(field.get("area_ha", 0.75)),
            crop_age_days=int(field.get("crop_age_days", 32)),
            crop_phase=field.get("crop_phase", "Fase 8 Vegetatif"),
            corn_variety=field.get("corn_variety", "BISI-18"),
            last_updated=field["last_updated"],
            battery_pct=battery_pct,
            is_simulated_failover=field.get("is_simulated_failover", False),
            is_postponed=field.get("is_postponed", False),
            postponed_at=field.get("postponed_at"),
            last_action=field.get("last_action"),
            metrics=FieldMetricsDTO(**metrics_dict),
            alert_banner=AlertBannerDTO(**field["alert_banner"]),
            shap_explanations=shap_dtos,
            physics_diagnostics=PhysicsDiagnosticsDTO(**field["physics_diagnostics"]) if field.get("physics_diagnostics") else PhysicsDiagnosticsDTO(
                k_urease_per_hour=0.143,
                hydrolysis_rate=0.141,
                is_physics_constrained=True,
                base_physics_score=24.6,
                residual_ai_score=-1.1,
                confidence_margin_pct=1.2
            )
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
            ),
            ForecastWindowItemDTO(
                timestamp_start="2026-10-25T15:00:00Z",
                timestamp_end="2026-10-25T18:00:00Z",
                avri_score=24.5,
                risk_category="aman",
                is_safe=True
            ),
            ForecastWindowItemDTO(
                timestamp_start="2026-10-25T18:00:00Z",
                timestamp_end="2026-10-25T21:00:00Z",
                avri_score=42.0,
                risk_category="waspada",
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
            self._telemetry_series[node_id] = self._generate_hourly_24h_telemetry()
        
        # Keep 24-hour hourly structure clean: update matching hour slot
        try:
            pt_dt = datetime.fromisoformat(point.timestamp.replace("Z", "+00:00"))
            hour = pt_dt.hour
            updated = False
            for i, p in enumerate(self._telemetry_series[node_id]):
                p_dt = datetime.fromisoformat(p.timestamp.replace("Z", "+00:00"))
                if p_dt.hour == hour:
                    self._telemetry_series[node_id][i] = point
                    updated = True
                    break
            if not updated and len(self._telemetry_series[node_id]) < 24:
                self._telemetry_series[node_id].append(point)
        except Exception:
            pass

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

    def get_field_parcels(self, field_id: str) -> Optional[FieldParcelsResponseDTO]:
        """
        Returns full detailed 12 bedeng cadastral parcels, surrounding mosaic parcels,
        and outer field boundaries with GeoJSON FeatureCollection.
        """
        if field_id not in self._bedeng_parcels or not self._bedeng_parcels[field_id] or self._bedeng_parcels[field_id][0].center[1] < 112.40:
            self._bedeng_parcels[field_id] = get_initial_12_bedeng_parcels()
        parcels = self._bedeng_parcels[field_id]

        summary = ParcelMapSummaryDTO(
            coordinates_text='6°54\'54"S 112°25\'19"E',
            soil_type_text='Hamparan Persawahan Jagung Desa Bluri (Aluvial Lempung Subur pH 7.2)',
            gateway_distance_km=0.32,
            total_area_ha=0.96,
            center_coordinates=[-6.915000, 112.422000],
            gateway_coordinates=[-6.917200, 112.420000],
            outer_boundary=BLURI_OUTER_BOUNDARY,
            surrounding_parcels=BLURI_SURROUNDING_PARCELS,
            satellite_metadata=SatelliteMetadataDTO(
                source="Sentinel-2 MultiSpectral (Copernicus) & UAV Orthomosaic",
                resolution="0.2m GSD High-Resolution / 10m Multi-Band",
                crs="EPSG:4326 (WGS84)",
                last_capture="2026-10-24T08:45:00Z",
                ndvi_mean=0.74,
                ndwi_mean=0.31,
                cloud_cover_pct=0.0
            )
        )

        geojson = generate_geojson_feature_collection(parcels)

        return FieldParcelsResponseDTO(
            field_id=field_id,
            summary=summary,
            parcels=parcels,
            geojson=geojson
        )

    def toggle_parcel_failover(
        self, field_id: str, parcel_id: str, is_dropout: Optional[bool] = None
    ) -> Optional[BedengParcelDTO]:
        """
        Simulates Node Dropout & triggers FAO-56 Digital Twin failover on backend.
        """
        if field_id not in self._bedeng_parcels:
            self._bedeng_parcels[field_id] = get_initial_12_bedeng_parcels()

        target: Optional[BedengParcelDTO] = None
        for i, p in enumerate(self._bedeng_parcels[field_id]):
            if p.id.lower() == parcel_id.lower() or p.node_id.lower() == parcel_id.lower():
                if is_dropout is not None:
                    new_status = "simulated" if is_dropout else "online"
                else:
                    new_status = "online" if p.status == "simulated" else "simulated"

                new_mode = "[Est-Simulated] FAO-56" if new_status == "simulated" else "LoRa Live Stream"
                updated = p.model_copy(update={"status": new_status, "telemetry_mode": new_mode})
                self._bedeng_parcels[field_id][i] = updated
                target = updated
                break

        return target

db = MockDB()

