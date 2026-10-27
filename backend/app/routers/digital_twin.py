"""
VolatiSafe AIoT — Digital Twin REST API Router
==============================================
Menyediakan endpoint REST untuk:
1. GET /api/v1/digital-twin/telemetry/{field_id} (15 Parameter Biofisika & BMKG - INTERFACES.md §3.2.B)
2. GET /api/v1/digital-twin/forecast-72h/{field_id} (Horizon 72 Jam Kontinu)
3. POST /api/v1/digital-twin/simulate-dropout (Simulasi Uji Coba Juri)
"""

import sys
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

# Pastikan workspace root dapat diakses untuk modul digital_twin
root_path = Path(__file__).resolve().parent.parent.parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from digital_twin.service import DigitalTwinService

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin"])


class SimulateDropoutRequest(BaseModel):
    field_id: str = Field(default="BLOK-A", description="ID Petak hamparan")
    elapsed_minutes: float = Field(default=180.0, description="Durasi pemutusan sensor (menit)")


@router.get("/telemetry/{field_id}")
def get_digital_twin_telemetry(field_id: str):
    """
    Mengembalikan telemetri lengkap 15 parameter biofisika tanah, cuaca BMKG Lamongan,
    dan status failover untuk konsol pengujian dewan juri / pengembang.
    Mematuhi kontrak INTERFACES.md §3.2.B.
    """
    service = DigitalTwinService.get_instance()
    payload = service.get_15_parameter_telemetry(field_id)
    return payload


@router.get("/forecast-72h/{field_id}")
def get_digital_twin_72h_forecast(field_id: str):
    """
    Menyajikan proyeksi kontinu 72 jam ke depan (resolusi per jam)
    dan 24 blok jendela 3 jam untuk visualisasi safe window di dashboard.
    """
    service = DigitalTwinService.get_instance()
    forecast_data = service.forecast_72h(field_id)
    return {
        "status": "success",
        "data": forecast_data
    }


@router.get("/bmkg/current")
def get_bmkg_current_weather(adm4: Optional[str] = Query(default=None, description="Kode Kemendagri Wilayah")):
    """
    Mengambil data cuaca terkini langsung dari API Resmi BMKG (api.bmkg.go.id).
    Default: Desa Banyubang, Kec. Solokuro, Kab. Lamongan (35.24.15.2009).
    """
    service = DigitalTwinService.get_instance()
    if adm4 and adm4 != service.bmkg_live.adm4_code:
        from digital_twin.bmkg_client import BMKGLiveClient
        client = BMKGLiveClient(adm4_code=adm4)
        weather = client.get_current_weather()
    else:
        weather = service.bmkg_live.get_current_weather()

    if not weather:
        # Fallback ke cuaca tipikal / replay
        weather = service.get_current_weather()

    return {
        "status": "success",
        "data": weather
    }


@router.get("/bmkg/forecast")
def get_bmkg_forecast(adm4: Optional[str] = Query(default=None, description="Kode Kemendagri Wilayah")):
    """
    Mengambil deret prakiraan cuaca 3 jam ke depan langsung dari API Resmi BMKG (api.bmkg.go.id).
    """
    service = DigitalTwinService.get_instance()
    if adm4 and adm4 != service.bmkg_live.adm4_code:
        from digital_twin.bmkg_client import BMKGLiveClient
        client = BMKGLiveClient(adm4_code=adm4)
        pts = client.get_forecast_points()
    else:
        pts = service.bmkg_live.get_forecast_points()

    return {
        "status": "success",
        "data": {
            "source": "API Resmi BMKG (api.bmkg.go.id)",
            "location": "Desa Banyubang, Kec. Solokuro, Lamongan",
            "adm4_code": adm4 or service.bmkg_live.adm4_code,
            "forecast_points": pts
        }
    }


@router.post("/simulate-dropout")
def simulate_sensor_dropout(payload: SimulateDropoutRequest):
    """
    Endpoint interaktif pengujian juri: Mensimulasikan pemutusan sensor secara on-demand
    untuk mengamati failover imputasi otomatis oleh Digital Twin.
    """
    service = DigitalTwinService.get_instance()
    res = service.simulate_sensor_dropout(
        field_id=payload.field_id,
        elapsed_minutes=payload.elapsed_minutes
    )
    return res
