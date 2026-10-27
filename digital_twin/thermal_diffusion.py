"""
VolatiSafe AIoT — Damped Soil Thermal Diffusion & Arrhenius Kinetics Model
==========================================================================
Modul perambatan panas dari udara ambien ke lapisan perakaran jagung (kedalaman 5 cm)
dengan redaman inersia termal berbasis kadar air tanah (VWC) dan kinetika urease Arrhenius.
"""

import math
from typing import Dict, Any, List, Tuple
from .soil_profiles import get_soil_profile, SoilProfile


class SoilThermalDiffusionModel:
    """
    Model difusi termal 1D tanah teredam dengan diskretisasi state-space.
    Memperhitungkan inersia termal kelembaban tanah dan radiasi surya langsung.
    """

    def __init__(self, depth_cm: float = 5.0, default_soil: str = "karst_lamongan"):
        self.depth_cm = depth_cm
        self.soil_profile: SoilProfile = get_soil_profile(default_soil)
        self.beta_solar = 0.15  # Derajat C per MJ/m2 per jam radiasi

        # Parameter Arrhenius Kinetika Urease (Soil Science Society of America)
        self.arrhenius_a = 2.4e7      # Pre-exponential factor (per jam)
        self.ea_joules = 48500.0       # Energi aktivasi (J/mol)
        self.gas_constant = 8.314      # J / (mol * K)

    def calculate_alpha(self, moisture_pct: float, soil_type: str = "karst_lamongan") -> float:
        """
        Menghitung koefisien difusivitas/konduktivitas termal dinamis alpha(theta).
        - Tanah basah (theta >= theta_fc): alpha = alpha_wet (0.10) -> lambat panas
        - Tanah kering (theta <= theta_wp): alpha = alpha_dry (0.28) -> cepat panas
        """
        profile = get_soil_profile(soil_type)
        theta_range = max(1.0, profile.theta_fc - profile.theta_wp)
        fraction = (moisture_pct - profile.theta_wp) / theta_range

        # Normalisasi ke rentang [0.0, 1.0]
        fraction_clamped = max(0.0, min(1.0, fraction))

        # Alpha menurun seiring meningkatnya kelembaban (inersia panas air tinggi)
        alpha = profile.alpha_dry - fraction_clamped * (profile.alpha_dry - profile.alpha_wet)
        return round(alpha, 4)

    def calculate_urease_rate(self, soil_temp_c: float) -> float:
        """
        Menghitung laju pemecahan urea oleh enzim urease k_urease (per jam)
        menggunakan Persamaan Arrhenius:
            k = A * exp(-Ea / (R * T_kelvin))
        """
        t_kelvin = max(273.15, soil_temp_c + 273.15)
        k = self.arrhenius_a * math.exp(-self.ea_joules / (self.gas_constant * t_kelvin))
        return round(k, 3)

    def step(
        self,
        current_t_soil: float,
        t_air: float,
        moisture_pct: float,
        solar_rad_mj_per_hour: float,
        dt_hours: float = 1.0,
        soil_type: str = "karst_lamongan"
    ) -> float:
        """
        Melakukan satu langkah simulasi transisi suhu tanah (dt_hours).

        T_soil(t+1) = T_soil(t) + alpha(theta) * (T_air(t) - T_soil(t)) * dt + beta * Rs(t) * dt
        """
        alpha = self.calculate_alpha(moisture_pct, soil_type)
        delta_air = (t_air - current_t_soil) * alpha * dt_hours
        delta_solar = self.beta_solar * max(0.0, solar_rad_mj_per_hour) * dt_hours

        new_temp = current_t_soil + delta_air + delta_solar

        # Batas fisik temperatur tanah alami di Lamongan (18.0 C s.d 48.0 C)
        clamped_temp = max(18.0, min(48.0, new_temp))
        return round(clamped_temp, 2)

    def estimate_phase_lag_minutes(self, moisture_pct: float, soil_type: str = "karst_lamongan") -> int:
        """
        Mengestimasi waktu jeda (phase lag) puncak suhu tanah terhadap suhu udara (menit).
        - Tanah basah: jeda lebih lama (~80-90 menit).
        - Tanah kering: jeda lebih pendek (~60-70 menit).
        """
        profile = get_soil_profile(soil_type)
        theta_range = max(1.0, profile.theta_fc - profile.theta_wp)
        fraction = max(0.0, min(1.0, (moisture_pct - profile.theta_wp) / theta_range))

        # Rentang phase lag: 60 menit (sangat kering) hingga 90 menit (sangat basah)
        lag_minutes = int(round(60.0 + fraction * 30.0))
        return lag_minutes

    def simulate_diurnal_cycle(
        self,
        initial_t_soil: float,
        moisture_pct: float,
        hourly_weather: List[Dict[str, float]],
        soil_type: str = "karst_lamongan"
    ) -> List[Dict[str, Any]]:
        """
        Mensimulasikan siklus suhu tanah 24 jam dari daftar cuaca per jam.
        """
        results = []
        t_soil = initial_t_soil
        for hour_idx, w in enumerate(hourly_weather):
            t_air = w["temp_air_c"]
            solar_rad_hr = w.get("solar_radiation_mj", 0.0)
            t_soil = self.step(
                current_t_soil=t_soil,
                t_air=t_air,
                moisture_pct=moisture_pct,
                solar_rad_mj_per_hour=solar_rad_hr,
                dt_hours=1.0,
                soil_type=soil_type
            )
            k_urease = self.calculate_urease_rate(t_soil)
            results.append({
                "hour_idx": hour_idx,
                "temp_air_c": t_air,
                "temp_soil_c": t_soil,
                "k_urease_rate_hr": k_urease,
                "phase_lag_minutes": self.estimate_phase_lag_minutes(moisture_pct, soil_type)
            })
        return results
