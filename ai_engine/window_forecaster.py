"""
VolatiSafe AIoT — Safe Application Window Forecaster (72-Hour Horizon)
=====================================================================
Modul ini bertugas menerima atau mengekstrak prakiraan cuaca 72 jam ke depan
(Stasiun BMKG Wilayah Lamongan), memproyeksikan dinamika tanah mikroklimat,
mengevaluasi skor AVRI per jam, dan mendeteksi jendela waktu aman berurutan
(Safe Application Window, AVRI <= 30%) untuk memandu petani di ladang.

Referensi Spek:
- docs/universal/PRD.md §3.1 (Skenario Safe Window Triggering)
- docs/universal/INTERFACES.md §2.2 (SafeWindowDTO)
"""

import os
import sys
import math
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

# Pastikan root proyek masuk ke sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ai_engine.inference import AVRIInferenceEngine, DEFAULT_MODEL_PATH


@dataclass
class SafeWindowInterval:
    start_time: str
    end_time: str
    duration_hours: int
    projected_mean_avri: float
    projected_min_avri: float
    confidence_pct: int
    recommendation_summary: str

    def to_dto_dict(self) -> Dict[str, Any]:
        """Format kompatibel dengan SafeWindowDTO pada INTERFACES.md §2."""
        return {
            "start_time": self.start_time,
            "end_time": self.end_time,
            "projected_avri": round(self.projected_mean_avri, 1),
            "confidence_pct": self.confidence_pct
        }


@dataclass
class HourlyForecastPoint:
    timestamp: str
    hour_idx: int
    air_temp_c: float
    soil_temp_c: float
    moisture_pct: float
    ph: float
    humidity_rh: float
    wind_speed_ms: float
    solar_radiation_mj: float
    rain_mm: float
    avri_score: float
    risk_category: str
    is_safe: bool


class SafeWindowForecaster:
    """
    Peramal jendela waktu aplikasi pupuk urea aman berbasis horizon 72 jam.
    """
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.inference_engine = AVRIInferenceEngine(model_path=model_path)

    def _estimate_soil_from_weather(
        self,
        base_moisture: float,
        base_ph: float,
        weather_points: List[Dict[str, Any]]
    ) -> List[Tuple[float, float, float]]:
        """
        Estimasi sederhana profil perambatan suhu tanah dan kadar air
        sepanjang 72 jam ke depan sesuai hukum inersia termal 1D.
        """
        results = []
        current_moist = base_moisture
        
        for i, pt in enumerate(weather_points):
            t_air = pt.get("air_temp_c", pt.get("temp_air_c", 28.0))
            rain = pt.get("precipitation_mm", pt.get("rain_forecast_mm", 0.0))
            solar = pt.get("solar_radiation_mj", 0.0)

            # 1. Perambatan panas: Suhu tanah memiliki jeda termal dan redaman inersia
            # Siang terik tanah bisa 1.5 - 2.5C lebih panas dari udara, malam lebih hangat dari udara
            if solar > 1.5:
                t_soil = t_air + 1.2 + (solar * 0.4)
            elif solar > 0.0:
                t_soil = t_air + 0.5
            else:
                t_soil = max(21.0, t_air - 0.5)

            # 2. Neraca air sederhana: Hujan menambah kelembaban, terik menguapkan
            if rain > 0.0:
                current_moist = min(39.5, current_moist + (rain * 0.8))
            else:
                evap = (solar * 0.15) + (max(0, t_air - 28.0) * 0.05)
                current_moist = max(13.8, current_moist - evap)

            results.append((round(t_soil, 1), round(current_moist, 1), round(base_ph, 2)))

        return results

    def forecast_72h_timeline(
        self,
        weather_df_or_list: Union[pd.DataFrame, List[Dict[str, Any]]],
        base_moisture: float = 28.0,
        base_ph: float = 7.8,
        dat: int = 30
    ) -> List[HourlyForecastPoint]:
        """
        Menghasilkan proyeksi risiko AVRI per jam sepanjang 72 jam.
        """
        if isinstance(weather_df_or_list, pd.DataFrame):
            records = weather_df_or_list.to_dict('records')
        else:
            records = list(weather_df_or_list)

        # Batasi tepat 72 jam ke depan
        records_72 = records[:72]
        if len(records_72) == 0:
            return []

        # Hitung estimasi profil tanah
        soil_profiles = self._estimate_soil_from_weather(base_moisture, base_ph, records_72)

        timeline = []
        for idx, (rec, (t_s, m_s, ph_s)) in enumerate(zip(records_72, soil_profiles)):
            ts = rec.get("timestamp_utc", rec.get("timestamp", f"H+{idx}"))
            t_a = rec.get("air_temp_c", rec.get("temp_air_c", 28.0))
            rh = rec.get("humidity_rh", rec.get("relative_humidity_pct", 75.0))
            wind = rec.get("wind_speed_ms", 1.5)
            solar = rec.get("solar_radiation_mj", 0.0)
            rain = rec.get("precipitation_mm", rec.get("rain_forecast_mm", 0.0))

            pred = self.inference_engine.predict_single(
                soil_temp_c=t_s,
                moisture_pct=m_s,
                ph=ph_s,
                air_temp_c=t_a,
                humidity_rh=rh,
                wind_speed_ms=wind,
                solar_radiation_mj=solar,
                rain_forecast_6h_mm=rain,
                dat=dat
            )

            score = pred["avri_score"]
            cat = pred["risk_category"]
            is_safe = (score <= 30.0)

            timeline.append(HourlyForecastPoint(
                timestamp=str(ts),
                hour_idx=idx,
                air_temp_c=t_a,
                soil_temp_c=t_s,
                moisture_pct=m_s,
                ph=ph_s,
                humidity_rh=rh,
                wind_speed_ms=wind,
                solar_radiation_mj=solar,
                rain_mm=rain,
                avri_score=score,
                risk_category=cat,
                is_safe=is_safe
            ))

        return timeline

    def detect_safe_windows(
        self,
        timeline: List[HourlyForecastPoint],
        min_consecutive_hours: int = 2
    ) -> List[SafeWindowInterval]:
        """
        Mendeteksi blok jam berurutan dengan AVRI <= 30% berdurasi minimal N jam.
        """
        windows: List[SafeWindowInterval] = []
        current_block: List[HourlyForecastPoint] = []

        for pt in timeline:
            if pt.is_safe:
                current_block.append(pt)
            else:
                if len(current_block) >= min_consecutive_hours:
                    windows.append(self._construct_window_interval(current_block))
                current_block = []

        # Cek jika blok terakhir memenuhi syarat durasi
        if len(current_block) >= min_consecutive_hours:
            windows.append(self._construct_window_interval(current_block))

        return windows

    def _construct_window_interval(self, block: List[HourlyForecastPoint]) -> SafeWindowInterval:
        """Membentuk objek SafeWindowInterval dari kumpulan titik jam aman berurutan."""
        start_pt = block[0]
        end_pt = block[-1]
        duration = len(block)
        
        scores = [pt.avri_score for pt in block]
        mean_avri = float(np.mean(scores))
        min_avri = float(np.min(scores))

        # Confidence decay: Prakiraan semakin jauh jamnya, tingkat keyakinan sedikit menurun
        # H0-24: 92-95%, H24-48: 84-88%, H48-72: 75-80%
        first_hour = start_pt.hour_idx
        if first_hour < 24:
            base_conf = 95 - int(first_hour * 0.4)
        elif first_hour < 48:
            base_conf = 88 - int((first_hour - 24) * 0.4)
        else:
            base_conf = 78 - int((first_hour - 48) * 0.3)
        confidence = max(60, min(95, base_conf))

        summary = (
            f"Jendela aman selama {duration} jam berurutan ({start_pt.timestamp} s.d {end_pt.timestamp}). "
            f"Rata-rata proyeksi risiko penguapan sangat rendah ({mean_avri:.1f}%). "
            f"Tingkat keyakinan prakiraan BMKG: {confidence}%."
        )

        return SafeWindowInterval(
            start_time=start_pt.timestamp,
            end_time=end_pt.timestamp,
            duration_hours=duration,
            projected_mean_avri=mean_avri,
            projected_min_avri=min_avri,
            confidence_pct=confidence,
            recommendation_summary=summary
        )

    def get_optimal_safe_window(
        self,
        timeline: List[HourlyForecastPoint]
    ) -> Optional[SafeWindowInterval]:
        """
        Mengambil jendela aman paling segera (soonest upcoming safe window).
        """
        windows = self.detect_safe_windows(timeline, min_consecutive_hours=2)
        if not windows:
            return None
        # Kembalikan jendela aman pertama yang muncul
        return windows[0]
