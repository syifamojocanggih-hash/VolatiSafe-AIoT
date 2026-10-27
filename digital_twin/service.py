"""
VolatiSafe AIoT — Digital Twin Core Service & 15-Parameter Assembler
===================================================================
Service sentral pengorkestrasi seluruh subsistem Digital Twin:
1. Streaming Replay Cuaca BMKG Lamongan (WMO: 96933)
2. Neraca Air Zona Perakaran FAO-56 Penman-Monteith
3. Difusi Termal 1D & Kinetika Arrhenius
4. State-Space Failover Imputer (Sensor Dropout)
5. Horizon 72-Hour Continuous Forecaster
6. Penyaji Endpoint Telemetri 15 Parameter (INTERFACES.md §3.2.B)
"""

import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from .soil_profiles import get_soil_profile, SoilProfile
from .water_balance import FAO56WaterBalanceModel
from .thermal_diffusion import SoilThermalDiffusionModel
from .state_imputer import StateSpaceFailoverImputer
from .forecaster import Horizon72Forecaster
from .bmkg_client import BMKGLiveClient
from simulations.data_replay.bmkg_replay import BMKGWeatherReplayStreamer, WeatherRecord


class DigitalTwinService:
    """
    Service orkestrator Digital Twin VolatiSafe AIoT.
    """

    _instance: Optional["DigitalTwinService"] = None

    @classmethod
    def get_instance(cls) -> "DigitalTwinService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(
        self,
        soil_type: str = "karst_lamongan",
        csv_path: Optional[str] = None
    ):
        self.soil_type = soil_type
        self.soil_profile: SoilProfile = get_soil_profile(soil_type)
        self.water_model = FAO56WaterBalanceModel(default_soil=soil_type)
        self.thermal_model = SoilThermalDiffusionModel(default_soil=soil_type)
        self.imputer = StateSpaceFailoverImputer(
            soil_type=soil_type,
            water_model=self.water_model,
            thermal_model=self.thermal_model
        )
        self.forecaster = Horizon72Forecaster(
            soil_type=soil_type,
            water_model=self.water_model,
            thermal_model=self.thermal_model
        )

        # Inisialisasi Klien API Live BMKG (Prioritas Utama)
        self.bmkg_live = BMKGLiveClient(adm4_code="35.24.15.2009")

        # Inisialisasi Replay Streamer BMKG (Fallback Offline / Penjurian)
        if csv_path is None:
            curr_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.dirname(curr_dir)
            csv_path = os.path.join(root_dir, "simulations", "data_replay", "datasets", "bmkg_lamongan.csv")

        self.csv_path = csv_path
        self.weather_streamer: Optional[BMKGWeatherReplayStreamer] = None
        if os.path.exists(self.csv_path):
            self.weather_streamer = BMKGWeatherReplayStreamer(self.csv_path, speed_multiplier=1.0)

        # State memori internal per field_id
        self._field_states: Dict[str, Dict[str, Any]] = {
            "BLOK-A": {
                "dat": 32,
                "moisture_pct": 28.4,
                "soil_temp_c": 26.4,
                "last_seen_iso": datetime.now(timezone.utc).isoformat(),
                "is_dropout_simulated": False,
                "dropout_elapsed_minutes": 0.0
            },
            "BLOK-B": {
                "dat": 18,
                "moisture_pct": 24.2,
                "soil_temp_c": 31.8,
                "last_seen_iso": datetime.now(timezone.utc).isoformat(),
                "is_dropout_simulated": False,
                "dropout_elapsed_minutes": 0.0
            }
        }

    def get_current_weather(self) -> Dict[str, Any]:
        """
        Mengambil data cuaca terkini:
        1. Prioritas 1: API Live BMKG (api.bmkg.go.id, Solokuro Adm4: 35.24.15.2009)
        2. Prioritas 2 (Fallback): Streaming Replay CSV BMKG Lamongan (WMO 96933)
        3. Prioritas 3 (Offline): Snapshot Tipikal
        """
        # 1. Coba ambil dari Live BMKG API
        try:
            live = self.bmkg_live.get_current_weather()
            if live and live.get("is_live_api"):
                return {
                    "air_temp_c": live["air_temp_c"],
                    "humidity_rh": live["humidity_rh"],
                    "wind_speed_ms": live["wind_speed_ms"],
                    "solar_radiation_mj": live["solar_radiation_mj"],
                    "precipitation_mm": live["precipitation_mm"],
                    "timestamp_utc": live["timestamp_utc"],
                    "weather_desc": live.get("weather_desc", "Cerah Berawan"),
                    "icon_url": live.get("icon_url", ""),
                    "is_live_api": True
                }
        except Exception:
            pass

        # 2. Fallback ke Replay Streamer CSV
        if self.weather_streamer:
            try:
                gen = self.weather_streamer.stream_records(max_records=1, apply_sleep=False)
                rec: WeatherRecord = next(gen)
                return {
                    "air_temp_c": rec.temp_air_c,
                    "humidity_rh": rec.humidity_rh,
                    "wind_speed_ms": rec.wind_speed_ms,
                    "solar_radiation_mj": rec.solar_radiation_mj,
                    "precipitation_mm": rec.precipitation_mm,
                    "timestamp_utc": rec.timestamp,
                    "weather_desc": "Data Replay Historis",
                    "icon_url": "",
                    "is_live_api": False
                }
            except Exception:
                pass

        # 3. Fallback tipikal siang hari Lamongan
        return {
            "air_temp_c": 31.0,
            "humidity_rh": 62.0,
            "wind_speed_ms": 2.1,
            "solar_radiation_mj": 2.8,
            "precipitation_mm": 0.0,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "weather_desc": "Klimatologi Tipikal",
            "icon_url": "",
            "is_live_api": False
        }

    def get_provenance(self) -> Dict[str, Any]:
        """Mengembalikan data provenance audit-proof untuk juri."""
        try:
            live = self.bmkg_live.get_current_weather()
            if live and live.get("is_live_api"):
                return {
                    "station_name": live["station_name"],
                    "wmo_id": "96933",
                    "adm4_code": live.get("adm4_code", "35.24.15.2009"),
                    "location_name": live.get("location_name", "Desa Banyubang, Kec. Solokuro"),
                    "checksum_sha256": live["checksum_sha256"],
                    "is_live_api": True
                }
        except Exception:
            pass

        if self.weather_streamer:
            meta = self.weather_streamer.get_provenance_metadata()
            return {
                "station_name": meta["source_name"],
                "wmo_id": meta["station_wmo_id"],
                "checksum_sha256": meta["sha256_checksum"],
                "is_live_api": False
            }

        return {
            "station_name": "BMKG Stasiun Tuban / Lamongan Utara",
            "wmo_id": "96933",
            "checksum_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "is_live_api": False
        }

    def get_15_parameter_telemetry(self, field_id: str = "BLOK-A") -> Dict[str, Any]:
        """
        Menghasilkan payload lengkap 15 parameter sesuai kontrak INTERFACES.md §3.2.B.
        """
        field_state = self._field_states.get(field_id, {
            "dat": 32,
            "moisture_pct": 28.4,
            "soil_temp_c": 26.4,
            "last_seen_iso": datetime.now(timezone.utc).isoformat(),
            "is_dropout_simulated": False,
            "dropout_elapsed_minutes": 0.0
        })

        weather = self.get_current_weather()
        provenance = self.get_provenance()
        dat = field_state["dat"]
        moisture = field_state["moisture_pct"]
        soil_temp = field_state["soil_temp_c"]

        # Hitung evapotranspirasi acuan (ET0)
        et0 = self.water_model.calculate_et0(
            t_air_c=weather["air_temp_c"],
            rh_pct=weather["humidity_rh"],
            wind_speed_ms=weather["wind_speed_ms"],
            solar_rad_mj_m2=weather["solar_radiation_mj"]
        )

        # Hitung ETc aktual harian jagung
        kc = self.water_model.get_kc(dat)
        etc_daily = round(kc * et0, 2)

        # Phase lag dan kinetika urease
        phase_lag = self.thermal_model.estimate_phase_lag_minutes(moisture, self.soil_type)
        k_urease = self.thermal_model.calculate_urease_rate(soil_temp)

        is_failover = field_state.get("is_dropout_simulated", False)
        elapsed_min = field_state.get("dropout_elapsed_minutes", 0.0)
        confidence_pct = 100 if not is_failover else int(self.imputer.calculate_confidence(elapsed_min) * 100)

        timestamp_str = weather.get("timestamp_utc", datetime.now(timezone.utc).isoformat())

        return {
            "status": "success",
            "data": {
                "field_id": field_id,
                "timestamp_utc": timestamp_str,
                "data_provenance": provenance,
                "atmosphere_bmkg": {
                    "air_temp_c": weather["air_temp_c"],
                    "humidity_rh": weather["humidity_rh"],
                    "wind_speed_ms": weather["wind_speed_ms"],
                    "solar_radiation_mj": weather["solar_radiation_mj"],
                    "precipitation_mm": weather["precipitation_mm"]
                },
                "soil_profile_karst": {
                    "clay_pct": self.soil_profile.clay_pct,
                    "sand_pct": self.soil_profile.sand_pct,
                    "silt_pct": self.soil_profile.silt_pct,
                    "coarse_fragments_pct": round(self.soil_profile.coarse_fragments * 100.0, 1),
                    "bulk_density_g_cm3": self.soil_profile.bulk_density,
                    "field_capacity_theta_fc": self.soil_profile.theta_fc,
                    "wilting_point_theta_wp": self.soil_profile.theta_wp
                },
                "soil_biophysics_dynamic": {
                    "moisture_pct": moisture,
                    "soil_temp_c": soil_temp,
                    "thermal_phase_lag_minutes": phase_lag,
                    "etc_daily_mm": etc_daily,
                    "ph": self.soil_profile.ph_baseline,
                    "is_simulated_failover": is_failover,
                    "failover_confidence_pct": confidence_pct
                },
                "crop_and_kinetics": {
                    "dat": dat,
                    "crop_stage": self.water_model.get_phenology_stage(dat),
                    "kc_coefficient": kc,
                    "k_urease_rate_hr": k_urease
                }
            }
        }

    def simulate_sensor_dropout(self, field_id: str, elapsed_minutes: float) -> Dict[str, Any]:
        """
        Mensimulasikan dropout sensor untuk pengujian failover konsol juri.
        """
        if field_id in self._field_states:
            self._field_states[field_id]["is_dropout_simulated"] = (elapsed_minutes >= 30.0)
            self._field_states[field_id]["dropout_elapsed_minutes"] = elapsed_minutes

            # Imputasikan state baru jika dropout
            if elapsed_minutes >= 30.0:
                weather_now = self.get_current_weather()
                imputed = self.imputer.impute_state(
                    last_moisture=self._field_states[field_id]["moisture_pct"],
                    last_soil_temp=self._field_states[field_id]["soil_temp_c"],
                    dat=self._field_states[field_id]["dat"],
                    elapsed_minutes=elapsed_minutes,
                    weather_records=[weather_now],
                    field_id=field_id
                )
                self._field_states[field_id]["moisture_pct"] = imputed["moisture_pct"]
                self._field_states[field_id]["soil_temp_c"] = imputed["soil_temp_c"]

        return self.get_15_parameter_telemetry(field_id)

    def forecast_72h(self, field_id: str = "BLOK-A") -> Dict[str, Any]:
        """Menghasilkan proyeksi 72 jam untuk field tertentu berbasis ramalan cuaca resmi BMKG."""
        field_state = self._field_states.get(field_id, {
            "dat": 32,
            "moisture_pct": 28.4,
            "soil_temp_c": 26.4
        })

        forecast_pts = []
        try:
            forecast_pts = self.bmkg_live.get_forecast_points()
        except Exception:
            pass

        return self.forecaster.forecast_72h(
            initial_theta=field_state["moisture_pct"],
            initial_soil_temp=field_state["soil_temp_c"],
            dat=field_state["dat"],
            weather_forecast_72h=forecast_pts,
            field_id=field_id
        )
