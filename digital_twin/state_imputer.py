"""
VolatiSafe AIoT — State-Space Failover & Sensor Dropout Imputer
==============================================================
Mesin imputasi celah data kontinu ketika node sensor fisik/Wokwi mengalami gangguan transmisi
atau kehilangan sinyal LoRa (> 30 menit).

Secara otonom memproyeksikan penurunan kadar air (FAO-56) dan kenaikan suhu tanah (Difusi Termal)
sehingga pipeline AI dan backend tetap menerima suplai telemetri valid tanpa jeda.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from .water_balance import FAO56WaterBalanceModel
from .thermal_diffusion import SoilThermalDiffusionModel
from .soil_profiles import get_soil_profile

try:
    from app.schemas.fields import FieldStateDTO
except ImportError:
    try:
        from backend.app.schemas.fields import FieldStateDTO
    except ImportError:
        from pydantic import BaseModel, Field

        class FieldStateDTO(BaseModel):
            node_id: str
            field_id: str
            recorded_at: str
            moisture_pct: float
            soil_temp_c: float
            ph: float
            is_predicted: bool = False
            confidence_score: float = 1.0
            failover_mode: str = "LIVE"
            elapsed_minutes: float = 0.0
            alert_guidance: Optional[str] = None

            def __getitem__(self, item: str) -> Any:
                return getattr(self, item)


class StateSpaceFailoverImputer:
    """
    Mesin failover imputasi cerdas pendeteksi dropout transmisi sensor lapangan.
    """

    def __init__(
        self,
        soil_type: str = "karst_lamongan",
        water_model: Optional[FAO56WaterBalanceModel] = None,
        thermal_model: Optional[SoilThermalDiffusionModel] = None
    ):
        self.soil_type = soil_type
        self.water_model = water_model or FAO56WaterBalanceModel(default_soil=soil_type)
        self.thermal_model = thermal_model or SoilThermalDiffusionModel(default_soil=soil_type)
        self.profile = get_soil_profile(soil_type)

    def calculate_confidence(self, elapsed_minutes: float) -> float:
        """
        Menghitung skor keyakinan data (1.0 = 100% saat live).
        Saat dropout, keyakinan terdegradasi secara mulus:
            Confidence = 1.0 * exp(-elapsed_hours / 24.0)
        """
        if elapsed_minutes < 30.0:
            return 1.0
        elapsed_hours = elapsed_minutes / 60.0
        decay = math.exp(-elapsed_hours / 24.0)
        return max(0.20, min(0.95, round(decay, 3)))

    def evaluate_dropout_mode(self, elapsed_minutes: float) -> Dict[str, Any]:
        """
        Mengevaluasi status mode berdasarkan selang waktu sejak transmisi sensor terakhir:
        - < 30 menit: LIVE
        - 30 menit s.d 12 jam: FAILOVER_IMPUTATION
        - > 12 jam: CRITICAL_TIMEOUT
        """
        if elapsed_minutes < 30.0:
            return {
                "mode": "LIVE",
                "is_predicted": False,
                "confidence_score": 1.0,
                "status_label": "Sensor Fisik Aktif (Live Ground Truth)",
                "requires_physical_check": False
            }
        elif elapsed_minutes <= 720.0:  # 12 Jam
            conf = self.calculate_confidence(elapsed_minutes)
            return {
                "mode": "FAILOVER_IMPUTATION",
                "is_predicted": True,
                "confidence_score": conf,
                "status_label": "Failover Aktif — Imputasi Otonom Biofisika Digital Twin",
                "requires_physical_check": False
            }
        else:
            return {
                "mode": "CRITICAL_TIMEOUT",
                "is_predicted": True,
                "confidence_score": 0.50,
                "status_label": "Kritis — Node Sensor Tidak Merespons > 12 Jam",
                "requires_physical_check": True
            }

    def reconcile_sensor_reattachment(
        self,
        sensor_theta: float,
        predicted_theta: float,
        sensor_temp: float,
        predicted_temp: float,
        threshold_delta: float = 4.0,
        cycle_count: int = 1
    ) -> Dict[str, Any]:
        """
        Melakukan rekonsiliasi data tanpa lonjakan grafik (No Graph Shock) saat sensor kembali online.
        Sesuai FAILOVER_IMPUTATION.md §4:
        - Jika |theta_sensor - theta_predicted| <= 4.0%:
            Terapkan EMA: 0.7 * sensor + 0.3 * predicted selama 2 siklus telemetri.
        - Jika selisih > 4.0%:
            Gunakan bacaan sensor langsung (step jump accepted / sudden rain / soil compaction event).
        """
        delta_theta = abs(sensor_theta - predicted_theta)
        delta_temp = abs(sensor_temp - predicted_temp)

        if delta_theta <= threshold_delta and cycle_count <= 2:
            reconciled_theta = round(0.7 * sensor_theta + 0.3 * predicted_theta, 2)
            reconciled_temp = round(0.7 * sensor_temp + 0.3 * predicted_temp, 2)
            smoothing_applied = True
            status_note = f"Smoothing EMA diterapkan (Siklus {cycle_count}/2, Delta Theta: {round(delta_theta, 2)}%)"
        else:
            reconciled_theta = round(sensor_theta, 2)
            reconciled_temp = round(sensor_temp, 2)
            smoothing_applied = False
            status_note = f"Sensor aktual diterima langsung (Delta Theta: {round(delta_theta, 2)}% > {threshold_delta}% atau siklus > 2)"

        return {
            "reconciled_moisture_pct": reconciled_theta,
            "reconciled_soil_temp_c": reconciled_temp,
            "delta_moisture": round(delta_theta, 2),
            "delta_soil_temp": round(delta_temp, 2),
            "smoothing_applied": smoothing_applied,
            "cycle_count": cycle_count,
            "status_note": status_note,
            "is_fully_reconciled": (cycle_count >= 2 or not smoothing_applied)
        }

    def impute_state(
        self,
        last_moisture: float,
        last_soil_temp: float,
        dat: int,
        elapsed_minutes: float,
        weather_records: List[Dict[str, float]],
        field_id: str = "BLOK-A",
        node_id: str = "VS-A1-003",
        last_seen_iso: Optional[str] = None
    ) -> FieldStateDTO:
        """
        Menghasilkan proyeksi state tanah terkini melalui komputasi FAO-56 & difusi termal.

        Returns:
            FieldStateDTO yang mematuhi INTERFACES.md §2 dan TASK_GUIDE.md DT-1.4
        """
        status_eval = self.evaluate_dropout_mode(elapsed_minutes)

        if not status_eval["is_predicted"]:
            # Jika masih dalam jendela live (< 30 menit), gunakan state sensor terakhir
            current_time_str = datetime.now(timezone.utc).isoformat()
            return FieldStateDTO(
                node_id=node_id,
                field_id=field_id,
                recorded_at=last_seen_iso or current_time_str,
                moisture_pct=round(last_moisture, 2),
                soil_temp_c=round(last_soil_temp, 2),
                ph=self.profile.ph_baseline,
                is_predicted=False,
                confidence_score=1.0,
                failover_mode="LIVE",
                elapsed_minutes=elapsed_minutes,
                alert_guidance=None
            )

        # Jalankan loop langkah waktu simulasi imputasi berbasis data cuaca BMKG
        imputed_moisture = last_moisture
        imputed_temp = last_soil_temp

        # Jika tidak ada riwayat cuaca spesifik, gunakan profil cuaca acuan tipikal
        records_to_process = weather_records if weather_records else [{
            "temp_air_c": 32.0,
            "humidity_rh": 60.0,
            "wind_speed_ms": 2.0,
            "solar_radiation_mj": 2.2,
            "precipitation_mm": 0.0
        }]

        dt_hours = max(0.25, (elapsed_minutes / 60.0) / len(records_to_process))

        for rec in records_to_process:
            t_air = rec.get("temp_air_c", 32.0)
            rh = rec.get("humidity_rh", 60.0)
            wind = rec.get("wind_speed_ms", 2.0)
            solar = rec.get("solar_radiation_mj", 2.0)
            rain = rec.get("precipitation_mm", 0.0)

            # 1. Hitung kehilangan air via FAO-56
            et0 = self.water_model.calculate_et0(t_air, rh, wind, solar)
            imputed_moisture, _, _ = self.water_model.update_soil_moisture(
                current_theta=imputed_moisture,
                dat=dat,
                et0_daily_mm=et0,
                rain_mm=rain,
                dt_hours=dt_hours,
                soil_type=self.soil_type
            )

            # 2. Hitung perambatan suhu tanah via difusi termal teredam
            solar_per_hr = solar / max(1.0, dt_hours * 24.0)
            imputed_temp = self.thermal_model.step(
                current_t_soil=imputed_temp,
                t_air=t_air,
                moisture_pct=imputed_moisture,
                solar_rad_mj_per_hour=solar_per_hr,
                dt_hours=dt_hours,
                soil_type=self.soil_type
            )

        guidance = None
        if status_eval["requires_physical_check"]:
            guidance = f"Node {node_id} hening selama {round(elapsed_minutes/60, 1)} jam. Periksa baterai 18650 atau posisi probe di {field_id}."

        return FieldStateDTO(
            node_id=node_id,
            field_id=field_id,
            recorded_at=datetime.now(timezone.utc).isoformat(),
            moisture_pct=round(imputed_moisture, 2),
            soil_temp_c=round(imputed_temp, 2),
            ph=self.profile.ph_baseline,
            is_predicted=True,
            confidence_score=status_eval["confidence_score"],
            failover_mode=status_eval["mode"],
            elapsed_minutes=round(elapsed_minutes, 1),
            alert_guidance=guidance
        )
