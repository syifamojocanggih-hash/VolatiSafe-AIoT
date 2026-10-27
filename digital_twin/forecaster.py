"""
VolatiSafe AIoT — 72-Hour Horizon Safe Application Forecaster
=============================================================
Generator proyeksi biofisika tanah 72 jam ke depan (H+0 s.d H+72) berbasis
ramalan cuaca BMKG. Digunakan untuk mengevaluasi jendela aman pemupukan harian
(skala strategis pukul 05:30 WIB) agar pupuk Urea tidak terpapar puncak penguapan amonia.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from .water_balance import FAO56WaterBalanceModel
from .thermal_diffusion import SoilThermalDiffusionModel
from .soil_profiles import get_soil_profile


class Horizon72Forecaster:
    """
    Peramal horizon 72 jam kontinu untuk estimasi profil tanah dan jendela aman pemupukan.
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

    def estimate_avri_proxy(self, moisture_pct: float, soil_temp_c: float, ph: float) -> float:
        """
        Estimasi skor AVRI proxy berbasis kinetika biofisika tanah:
        - Suhu tanah tinggi memicu hidrolisis urea Arrhenius
        - Kelembaban rendah menghambat pelarutan dan mempermudah pelepasan gas NH3
        - pH alkalin menggeser kesetimbangan ion NH4+ ke gas volatil NH3
        """
        # Komponen suhu (baseline 22 C = 0, 36 C = max)
        temp_score = max(0.0, min(40.0, (soil_temp_c - 22.0) * 2.6))

        # Komponen kekeringan (36.5% basah = 0, 14.2% kering = 35)
        moist_score = max(0.0, min(35.0, (self.profile.theta_fc - moisture_pct) * 1.5))

        # Komponen alkalinitas pH (pH 7.0 = 0, pH 8.2 = 15)
        ph_score = max(0.0, min(15.0, (ph - 7.0) * 10.0))

        total_score = temp_score + moist_score + ph_score
        return round(max(5.0, min(95.0, total_score)), 1)

    def classify_risk(self, avri_score: float) -> str:
        """Kategori risiko 4 tingkat VolatiSafe."""
        if avri_score <= 30.0:
            return "aman"
        elif avri_score <= 50.0:
            return "waspada"
        elif avri_score <= 75.0:
            return "kritis"
        else:
            return "bahaya"

    def forecast_72h(
        self,
        initial_theta: float,
        initial_soil_temp: float,
        dat: int,
        weather_forecast_72h: List[Dict[str, float]],
        start_time_utc: Optional[datetime] = None,
        field_id: str = "BLOK-A"
    ) -> Dict[str, Any]:
        """
        Menghasilkan proyeksi kontinu 72 jam ke depan (resolusi per jam)
        dan mengagregasikan ke dalam blok jendela 3 jam sesuai kontrak INTERFACES.md §3.2.C.
        """
        base_time = start_time_utc or datetime.now(timezone.utc)
        hourly_timeline = []

        curr_theta = initial_theta
        curr_temp = initial_soil_temp

        forecast_len = len(weather_forecast_72h)
        for h in range(72):
            # Titik ramalan BMKG biasanya dalam blok 3 jam
            bmkg_idx = h // 3
            hour_local = (base_time.hour + 7 + h) % 24  # WIB (UTC+7)
            is_day = 6 <= hour_local <= 18

            if bmkg_idx < forecast_len:
                w = weather_forecast_72h[bmkg_idx]
                t_air = w.get("temp_air_c", 30.0)
                rh = w.get("humidity_rh", 65.0)
                wind = w.get("wind_speed_ms", 2.0)
                solar = w.get("solar_radiation_mj", 2.0 if is_day else 0.0)
                if not is_day:
                    solar = 0.0
                rain = w.get("precipitation_mm", 0.0)
            else:
                # Pola diurnal 24 jam alami Lamongan jika melebihi horizon BMKG
                t_air = 24.5 + 9.0 * max(0.0, math.sin(math.pi * (hour_local - 6) / 12.0))
                rh = 88.0 - 38.0 * max(0.0, math.sin(math.pi * (hour_local - 6) / 12.0))
                wind = 1.5 + (1.2 if is_day else 0.4)
                solar = max(0.0, 3.2 * math.sin(math.pi * (hour_local - 6) / 12.0)) if is_day else 0.0
                rain = 0.0

            # 1. Update kelembaban tanah via FAO-56
            et0 = self.water_model.calculate_et0(t_air, rh, wind, solar)
            curr_theta, etc_mm, _ = self.water_model.update_soil_moisture(
                current_theta=curr_theta,
                dat=dat + int(h / 24),
                et0_daily_mm=et0,
                rain_mm=rain,
                dt_hours=1.0,
                soil_type=self.soil_type
            )

            # 2. Update suhu tanah via Difusi Termal
            curr_temp = self.thermal_model.step(
                current_t_soil=curr_temp,
                t_air=t_air,
                moisture_pct=curr_theta,
                solar_rad_mj_per_hour=solar,
                dt_hours=1.0,
                soil_type=self.soil_type
            )

            point_time = base_time + timedelta(hours=h)
            avri = self.estimate_avri_proxy(curr_theta, curr_temp, self.profile.ph_baseline)
            k_urease = self.thermal_model.calculate_urease_rate(curr_temp)

            hourly_timeline.append({
                "hour_step": h + 1,
                "timestamp_utc": point_time.isoformat(),
                "projected_theta_pct": curr_theta,
                "projected_soil_temp_c": curr_temp,
                "temp_air_c": round(t_air, 1),
                "avri_score": avri,
                "risk_category": self.classify_risk(avri),
                "k_urease_rate_hr": k_urease,
                "is_safe": avri <= 30.0
            })

        # Agregasikan ke dalam 24 blok jendela 3 jam
        three_hour_windows = []
        for w_idx in range(24):
            start_h = w_idx * 3
            end_h = start_h + 3
            slice_steps = hourly_timeline[start_h:end_h]
            avg_avri = round(sum(s["avri_score"] for s in slice_steps) / 3.0, 1)
            cat = self.classify_risk(avg_avri)
            three_hour_windows.append({
                "window_idx": w_idx + 1,
                "timestamp_start": slice_steps[0]["timestamp_utc"],
                "timestamp_end": slice_steps[-1]["timestamp_utc"],
                "avri_score": avg_avri,
                "risk_category": cat,
                "is_safe": cat == "aman",
                "avg_moisture_pct": round(sum(s["projected_theta_pct"] for s in slice_steps) / 3.0, 1),
                "avg_soil_temp_c": round(sum(s["projected_soil_temp_c"] for s in slice_steps) / 3.0, 1),
            })

        # Temukan jendela aman pertama yang terbuka
        next_safe = None
        for win in three_hour_windows:
            if win["is_safe"]:
                next_safe = {
                    "start_time": win["timestamp_start"],
                    "end_time": win["timestamp_end"],
                    "projected_avri": win["avri_score"],
                    "confidence_pct": 88
                }
                break

        return {
            "field_id": field_id,
            "horizon_hours": 72,
            "generated_at": base_time.isoformat(),
            "next_safe_window": next_safe,
            "windows": three_hour_windows,
            "hourly_timeline": hourly_timeline
        }
