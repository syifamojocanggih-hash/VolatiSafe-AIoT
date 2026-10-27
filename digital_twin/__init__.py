"""
VolatiSafe AIoT — Agro-Climatic Digital Twin Engine
===================================================
Mesin biofisika tanah virtual kontinu yang memodelkan neraca air zona perakaran (FAO-56),
difusi termal teredam 1D, imputasi celah data failover state-space, dan proyeksi horizon 72 jam.
"""

from .soil_profiles import SOIL_PROFILES, SoilProfile
from .water_balance import FAO56WaterBalanceModel
from .thermal_diffusion import SoilThermalDiffusionModel
from .state_imputer import StateSpaceFailoverImputer
from .forecaster import Horizon72Forecaster
from .service import DigitalTwinService

__version__ = "1.0.0"
__all__ = [
    "SOIL_PROFILES",
    "SoilProfile",
    "FAO56WaterBalanceModel",
    "SoilThermalDiffusionModel",
    "StateSpaceFailoverImputer",
    "Horizon72Forecaster",
    "DigitalTwinService",
]
