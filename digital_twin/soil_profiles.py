"""
VolatiSafe AIoT — Soil Baseline Profiles & Saxton-Rawls Constants
=================================================================
Data baseline karakteristik tanah sentra jagung nasional:
1. Lokus Lamongan Utara (Solokuro, Desa Banyubang & Bluri):
   Mollisol / Rendzina & Alfisol (Tanah Karst/Kapur Alkalin)
2. Lokus Lampung Tengah / Metro:
   Ultisol pasca-dolomit (Tanah Masam dikapur)

Ditransformasikan dari survei BBSDLP, ISRIC SoilGrids 250m, dan Pedotransfer Function
Saxton & Rawls (2006).
"""

from dataclasses import dataclass
from typing import Dict, Any


@dataclass(frozen=True)
class SoilProfile:
    id: str
    nama_ordo: str
    tekstur: str
    clay_pct: float
    sand_pct: float
    silt_pct: float
    theta_wp: float          # Titik layu permanen (% VWC)
    theta_fc: float          # Kapasitas lapang (% VWC)
    theta_sat: float         # Kadar air jenuh (% VWC)
    coarse_fragments: float  # Fraksi kerikil/fragmen kasar (rasio volume)
    bulk_density: float      # g/cm3
    ph_baseline: float       # pH tanah ruah makro
    alpha_dry: float         # Difusivitas termal tanah kering
    alpha_wet: float         # Difusivitas termal tanah basah
    drainage_rate: float     # Laju perkolasi/drainase pori makro per jam

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "nama_ordo": self.nama_ordo,
            "tekstur": self.tekstur,
            "clay_pct": self.clay_pct,
            "sand_pct": self.sand_pct,
            "silt_pct": self.silt_pct,
            "theta_wp": self.theta_wp,
            "theta_fc": self.theta_fc,
            "theta_sat": self.theta_sat,
            "coarse_fragments_pct": self.coarse_fragments * 100.0,
            "bulk_density_g_cm3": self.bulk_density,
            "ph_baseline": self.ph_baseline,
            "alpha_dry": self.alpha_dry,
            "alpha_wet": self.alpha_wet,
            "drainage_rate": self.drainage_rate,
        }


SOIL_PROFILES: Dict[str, SoilProfile] = {
    "karst_lamongan": SoilProfile(
        id="karst_lamongan",
        nama_ordo="Mollisol / Rendzina & Alfisol (Tanah Karst Solokuro)",
        tekstur="Clay Loam berkerikil kapur",
        clay_pct=38.0,
        sand_pct=24.0,
        silt_pct=38.0,
        theta_wp=14.2,
        theta_fc=36.5,
        theta_sat=46.0,
        coarse_fragments=0.12,
        bulk_density=1.34,
        ph_baseline=7.85,
        alpha_dry=0.28,
        alpha_wet=0.10,
        drainage_rate=0.38
    ),
    "ultisol_lampung": SoilProfile(
        id="ultisol_lampung",
        nama_ordo="Ultisol pasca-dolomit (Tanah Podsolik Dikapur)",
        tekstur="Sandy Clay Loam",
        clay_pct=32.0,
        sand_pct=42.0,
        silt_pct=26.0,
        theta_wp=11.5,
        theta_fc=36.2,
        theta_sat=45.0,
        coarse_fragments=0.05,
        bulk_density=1.38,
        ph_baseline=7.45,
        alpha_dry=0.30,
        alpha_wet=0.11,
        drainage_rate=0.45
    )
}


def get_soil_profile(soil_id: str = "karst_lamongan") -> SoilProfile:
    """Mengembalikan konfigurasi profil tanah (default: karst_lamongan)."""
    return SOIL_PROFILES.get(soil_id, SOIL_PROFILES["karst_lamongan"])
