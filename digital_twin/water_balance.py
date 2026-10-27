"""
VolatiSafe AIoT — FAO-56 Penman-Monteith Soil Moisture & Water Balance Model
===========================================================================
Modul pemodelan neraca air lapisan perakaran jagung kontinu berbasis:
- Standar FAO Irrigation and Drainage Paper No. 56 (Allen et al., 1998)
- Koefisien tanaman jagung dinamis Kc(DAT) dan kedalaman perakaran Zr(DAT)
- Pemutakhiran kadar air volumetrik (theta % VWC) ter-clamp antara titik layu (theta_wp)
  dan kapasitas lapang (theta_fc) sesuai data tanah karst Solokuro, Lamongan.
"""

import math
from typing import Tuple, Dict, Any
from .soil_profiles import get_soil_profile, SoilProfile


class FAO56WaterBalanceModel:
    """
    Model neraca air lapisan perakaran tanaman jagung berbasis persamaan FAO-56 Penman-Monteith.
    """

    def __init__(self, elevation_m: float = 65.0, default_soil: str = "karst_lamongan"):
        self.elevation_m = elevation_m
        self.soil_profile: SoilProfile = get_soil_profile(default_soil)

        # Tekanan atmosfer rata-rata pada elevasi tertentu (kPa)
        self.patm_kpa = 101.3 * math.pow((293.0 - 0.0065 * self.elevation_m) / 293.0, 5.26)
        # Konstanta psikrometrik (gamma)
        self.gamma_kpa_c = 0.000665 * self.patm_kpa

    def calculate_et0(
        self,
        t_air_c: float,
        rh_pct: float,
        wind_speed_ms: float,
        solar_rad_mj_m2: float
    ) -> float:
        """
        Menghitung evapotranspirasi acuan standar rumput harian (ET0) dalam satuan mm/hari.
        Menggunakan kombinasi energi surya dan aerodinamika Penman-Monteith FAO-56.
        """
        t_mean = t_air_c
        rh_clamped = max(5.0, min(100.0, rh_pct))
        u2 = max(0.1, wind_speed_ms)

        # 1. Tekanan uap jenuh (es) dalam kPa
        es = 0.6108 * math.exp((17.27 * t_mean) / (t_mean + 237.3))

        # 2. Tekanan uap aktual (ea) dalam kPa
        ea = es * (rh_clamped / 100.0)

        # 3. Kemiringan kurva tekanan uap (Delta)
        delta = (4098.0 * es) / math.pow(t_mean + 237.3, 2.0)

        # 4. Radiasi bersih netto (Rn) dalam MJ/m2/hari
        # Asumsi albedo tajuk acuan standar alpha = 0.23
        rn = max(0.0, 0.77 * solar_rad_mj_m2)

        # Fluks panas tanah G diasumsikan 0 untuk estimasi harian
        g_flux = 0.0

        # 5. Persamaan Utama FAO-56 Penman-Monteith
        num_radiation = 0.408 * delta * (rn - g_flux)
        num_aerodynamic = self.gamma_kpa_c * (900.0 / (t_mean + 273.0)) * u2 * (es - ea)
        denominator = delta + self.gamma_kpa_c * (1.0 + 0.34 * u2)

        et0 = (num_radiation + num_aerodynamic) / denominator
        return max(0.0, round(et0, 3))

    def get_kc(self, dat: int) -> float:
        """
        Mengembalikan koefisien tanaman jagung Kc dinamis berdasarkan umur tanaman (DAT / HST):
        - 0-14 HST: VE-V2 (Kc = 0.40)
        - 15-35 HST: V3-V8 (Kc = 0.80)
        - 36-65 HST: VT-R1 Pembungaan (Kc = 1.15)
        - 66-85 HST: R2-R4 Pengisian Biji (Kc = 1.05)
        - 86-105 HST: R5-R6 Pemasakan (Kc = 0.60)
        - >105 HST: Pasca-Panen (Kc = 0.40)
        """
        if dat <= 14:
            return 0.40
        elif dat <= 35:
            # Interpolasi bertahap dari 0.40 ke 0.80
            progress = (dat - 14) / (35 - 14)
            return round(0.40 + progress * 0.40, 3)
        elif dat <= 65:
            return 1.15
        elif dat <= 85:
            return 1.05
        elif dat <= 105:
            return 0.60
        else:
            return 0.40

    def get_root_depth_m(self, dat: int) -> float:
        """
        Mengembalikan kedalaman perakaran jagung efektif Zr (meter):
        - VE-V2: 0.15 m
        - V3-V8: 0.30 m
        - VT-R1: 0.50 m
        - R2-R6: 0.60 m
        """
        if dat <= 14:
            return 0.15
        elif dat <= 35:
            return 0.30
        elif dat <= 65:
            return 0.50
        else:
            return 0.60

    def get_phenology_stage(self, dat: int) -> str:
        """Keterangan fase fenologi jagung untuk DTO."""
        if dat <= 14:
            return "VE-V2 (Perkecambahan & Vegetatif Awal)"
        elif dat <= 35:
            return "V3-V8 (Vegetatif Cepat)"
        elif dat <= 65:
            return "VT-R1 (Pembungaan & Malai)"
        elif dat <= 85:
            return "R2-R4 (Pengisian Biji)"
        elif dat <= 105:
            return "R5-R6 (Pemasakan Akhir)"
        else:
            return "Pasca-Panen / Bera"

    def calculate_effective_rain(self, rain_mm: float) -> float:
        """
        Curah hujan efektif yang meresap ke lapisan perakaran (menghitung intersepsi kanopi).
        - P <= 5 mm -> Peff = 0.70 * P
        - P > 5 mm  -> Peff = 0.85 * P - 2.0
        """
        if rain_mm <= 0.0:
            return 0.0
        elif rain_mm <= 5.0:
            return 0.70 * rain_mm
        else:
            return max(0.0, 0.85 * rain_mm - 2.0)

    def update_soil_moisture(
        self,
        current_theta: float,
        dat: int,
        et0_daily_mm: float,
        rain_mm: float,
        dt_hours: float = 1.0,
        soil_type: str = "karst_lamongan"
    ) -> Tuple[float, float, float]:
        """
        Memutakhirkan kadar air volumetrik tanah (theta % VWC) untuk interval dt_hours.

        Returns:
            Tuple[updated_theta_pct, etc_interval_mm, drain_interval_mm]
        """
        profile = get_soil_profile(soil_type)
        kc = self.get_kc(dat)
        zr = self.get_root_depth_m(dat)

        # Evapotranspirasi aktual tanaman jagung untuk rentang dt_hours (mm)
        etc_interval = kc * et0_daily_mm * (dt_hours / 24.0)

        # Hujan efektif untuk rentang dt_hours (mm)
        peff_interval = self.calculate_effective_rain(rain_mm)

        # Jika tanah melebihi kapasitas lapang, hitung perkolasi drainase cepat
        drain_interval = 0.0
        if current_theta > profile.theta_fc:
            excess_vwc = current_theta - profile.theta_fc
            drain_fraction = profile.drainage_rate * (dt_hours / 1.0)
            drain_vwc = excess_vwc * min(1.0, drain_fraction)
            drain_interval = (drain_vwc / 100.0) * (zr * 1000.0)
        else:
            drain_vwc = 0.0

        # Perubahan kadar air volumetrik tanah (% VWC)
        # Delta theta (%) = ((Peff - ETc) / (Zr * 1000 mm)) * 100% - drain_vwc
        delta_theta_pct = ((peff_interval - etc_interval) / (zr * 1000.0)) * 100.0 - drain_vwc

        raw_new_theta = current_theta + delta_theta_pct

        # Batasan fisik tegas: tanah tidak pernah lebih kering dari titik layu permanen
        # dan tidak melebihi kapasitas lapang setelah drainase.
        clamped_theta = max(profile.theta_wp, min(profile.theta_fc, raw_new_theta))

        return round(clamped_theta, 2), round(etc_interval, 3), round(drain_interval, 3)
