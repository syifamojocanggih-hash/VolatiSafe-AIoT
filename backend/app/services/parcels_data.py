from typing import List, Dict, Any
from app.schemas.parcels import BedengParcelDTO, SurroundingParcelDTO, ParcelMapSummaryDTO, SatelliteMetadataDTO

# Real agricultural parcel perimeter (Hamparan Sawah Tegal Jagung Blok A - Solokuro, Lamongan)
# Coordinates centered around real agricultural cropland: -6.912350, 112.345680
SOLOKURO_OUTER_BOUNDARY: List[List[float]] = [
    [-6.911750, 112.345200],
    [-6.911750, 112.346160],
    [-6.912960, 112.346160],
    [-6.912960, 112.345200]
]
BLURI_OUTER_BOUNDARY = SOLOKURO_OUTER_BOUNDARY

# Surrounding real agricultural fields and buffer zones
SOLOKURO_SURROUNDING_PARCELS: List[SurroundingParcelDTO] = [
    SurroundingParcelDTO(
        id="C01",
        name="Lahan Sawah Solokuro Lor (Blok 1B)",
        area_ha=0.45,
        center=[-6.911450, 112.345680],
        polygon=[
            [-6.911150, 112.345200],
            [-6.911150, 112.346160],
            [-6.911750, 112.346160],
            [-6.911750, 112.345200]
        ]
    ),
    SurroundingParcelDTO(
        id="C02",
        name="Lahan Pertanian Kulon (Arah Solokuro Kulon)",
        area_ha=0.62,
        center=[-6.912355, 112.344750],
        polygon=[
            [-6.911750, 112.344300],
            [-6.911750, 112.345200],
            [-6.912960, 112.345200],
            [-6.912960, 112.344300]
        ]
    ),
    SurroundingParcelDTO(
        id="C03",
        name="Lahan Sawah Solokuro Kidul (Arah Banyubang)",
        area_ha=0.58,
        center=[-6.913250, 112.345680],
        polygon=[
            [-6.912960, 112.345200],
            [-6.912960, 112.346160],
            [-6.913550, 112.346160],
            [-6.913550, 112.345200]
        ]
    ),
    SurroundingParcelDTO(
        id="C04",
        name="Persil Sawah Wetan (Seberang Jalan Usaha Tani)",
        area_ha=0.52,
        center=[-6.912355, 112.346600],
        polygon=[
            [-6.911750, 112.346200],
            [-6.911750, 112.347000],
            [-6.912960, 112.347000],
            [-6.912960, 112.346200]
        ]
    )
]
BLURI_SURROUNDING_PARCELS = SOLOKURO_SURROUNDING_PARCELS

def get_initial_12_bedeng_parcels() -> List[BedengParcelDTO]:
    """
    Returns 12 high-precision agricultural bedeng parcels across Blok A, B, and C
    in true cropland of Solokuro, Lamongan (-6.912350, 112.345680).
    Derived from actual satellite imagery of agricultural plots in Solokuro.
    """
    return [
        # === TIER A: UTARA (North Agricultural Strips) ===
        BedengParcelDTO(
            id="A1",
            node_id="VS-A1-001",
            name="Blok A1 · Sawah Solokuro Lor (Utara-Barat)",
            short_name="A1 · Solokuro Lor Barat",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=22.4,
            soil_temp_c=34.1,
            ph=7.83,
            battery_v=3.92,
            battery_pct=84,
            lora_signal_dbm=-76,
            avri_score=74,
            avri_category="kritis",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Tunda! Suhu tanah terik (34,1°C) dan kelembapan rendah (22,4%). Tunggu hujan atau siram sebelum pemupukan.",
            center=[-6.911985, 112.345358],
            polygon=[
                [-6.911800, 112.345250],
                [-6.911800, 112.345465],
                [-6.912170, 112.345465],
                [-6.912170, 112.345250],
            ],
        ),
        BedengParcelDTO(
            id="A2",
            node_id="VS-A1-002",
            name="Blok A2 · Sawah Solokuro Lor (Utara-Tengah 1)",
            short_name="A2 · Solokuro Lor Tengah",
            area_ha=0.08,
            crop_variety="NK-212",
            moisture_pct=36.8,
            soil_temp_c=26.4,
            ph=7.10,
            battery_v=4.01,
            battery_pct=94,
            lora_signal_dbm=-71,
            avri_score=18,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Aman dipupuk! Suhu tanah sejuk (26,4°C) dan kelembapan prima (36,8%). Manfaatkan jendela waktu sekarang.",
            center=[-6.911985, 112.345573],
            polygon=[
                [-6.911800, 112.345465],
                [-6.911800, 112.345680],
                [-6.912170, 112.345680],
                [-6.912170, 112.345465],
            ],
        ),
        BedengParcelDTO(
            id="A3",
            node_id="VS-A1-003",
            name="Blok A3 · Sawah Solokuro Lor (Utara-Tengah 2)",
            short_name="A3 · Solokuro Lor Tengah",
            area_ha=0.08,
            crop_variety="Pioneer P35",
            moisture_pct=19.2,
            soil_temp_c=36.0,
            ph=7.89,
            battery_v=3.85,
            battery_pct=78,
            lora_signal_dbm=-82,
            avri_score=83,
            avri_category="bahaya",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="BAHAYA! Risiko penguapan amonia ekstrem (>80%). Jangan lakukan pemupukan permukaan saat ini.",
            center=[-6.911985, 112.345788],
            polygon=[
                [-6.911800, 112.345680],
                [-6.911800, 112.345895],
                [-6.912170, 112.345895],
                [-6.912170, 112.345680],
            ],
        ),
        BedengParcelDTO(
            id="A4",
            node_id="VS-A1-004",
            name="Blok A4 · Sawah Solokuro Lor (Utara-Timur Jalan)",
            short_name="A4 · Solokuro Lor Timur",
            area_ha=0.08,
            crop_variety="Bisi-2",
            moisture_pct=28.1,
            soil_temp_c=29.8,
            ph=7.42,
            battery_v=3.96,
            battery_pct=88,
            lora_signal_dbm=-74,
            avri_score=46,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada! Gunakan metode benam (tugal kedalaman 5-7 cm) bila terpaksa memupuk hari ini.",
            center=[-6.911985, 112.346003],
            polygon=[
                [-6.911800, 112.345895],
                [-6.911800, 112.346110],
                [-6.912170, 112.346110],
                [-6.912170, 112.345895],
            ],
        ),

        # === TIER B: MADYA (Middle Core Cultivation Strips) ===
        BedengParcelDTO(
            id="B1",
            node_id="VS-B1-001",
            name="Blok B1 · Sawah Solokuro Madya (Tengah-Barat)",
            short_name="B1 · Solokuro Madya Barat",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=34.2,
            soil_temp_c=27.1,
            ph=7.15,
            battery_v=3.90,
            battery_pct=82,
            lora_signal_dbm=-78,
            avri_score=24,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Kondisi aman. Kelembapan tanah cukup untuk hidrolisis perlahan tanpa penguapan amonia masif.",
            center=[-6.912355, 112.345358],
            polygon=[
                [-6.912170, 112.345250],
                [-6.912170, 112.345465],
                [-6.912540, 112.345465],
                [-6.912540, 112.345250],
            ],
        ),
        BedengParcelDTO(
            id="B2",
            node_id="VS-B1-002",
            name="Blok B2 · Sawah Solokuro Madya (Tengah-Inti)",
            short_name="B2 · Solokuro Madya Inti",
            area_ha=0.08,
            crop_variety="NK-212",
            moisture_pct=26.0,
            soil_temp_c=31.2,
            ph=7.55,
            battery_v=4.08,
            battery_pct=98,
            lora_signal_dbm=-68,
            avri_score=52,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada: Kelembapan 26.0% mendekati batas kritis 25%. Dianjurkan menunda pemupukan hingga sore hari.",
            center=[-6.912355, 112.345573],
            polygon=[
                [-6.912170, 112.345465],
                [-6.912170, 112.345680],
                [-6.912540, 112.345680],
                [-6.912540, 112.345465],
            ],
        ),
        BedengParcelDTO(
            id="B3",
            node_id="VS-B1-003",
            name="Blok B3 · Sawah Solokuro Madya (Tengah-Timur 1)",
            short_name="B3 · Solokuro Madya Timur",
            area_ha=0.08,
            crop_variety="Pioneer P35",
            moisture_pct=23.1,
            soil_temp_c=33.5,
            ph=7.75,
            battery_v=3.88,
            battery_pct=80,
            lora_signal_dbm=-80,
            avri_score=68,
            avri_category="kritis",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="KRITIS! Kehilangan nitrogen diperkirakan mencapai 68%. Jangan sebar urea.",
            center=[-6.912355, 112.345788],
            polygon=[
                [-6.912170, 112.345680],
                [-6.912170, 112.345895],
                [-6.912540, 112.345895],
                [-6.912540, 112.345680],
            ],
        ),
        BedengParcelDTO(
            id="B4",
            node_id="VS-B1-004",
            name="Blok B4 · Sawah Solokuro Madya (Tengah-Sisi Jalan)",
            short_name="B4 · Solokuro Madya Jalan",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=33.5,
            soil_temp_c=27.6,
            ph=7.22,
            battery_v=3.98,
            battery_pct=90,
            lora_signal_dbm=-73,
            avri_score=26,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Aman: Kanopi tanaman di dekat jalan cukup menaungi tanah, menekan kenaikan suhu permukaan.",
            center=[-6.912355, 112.346003],
            polygon=[
                [-6.912170, 112.345895],
                [-6.912170, 112.346110],
                [-6.912540, 112.346110],
                [-6.912540, 112.345895],
            ],
        ),

        # === TIER C: KIDUL (South Cropland Strips) ===
        BedengParcelDTO(
            id="C1",
            node_id="VS-C1-001",
            name="Blok C1 · Sawah Solokuro Kidul (Selatan-Barat)",
            short_name="C1 · Solokuro Kidul Barat",
            area_ha=0.08,
            crop_variety="NK-212",
            moisture_pct=35.0,
            soil_temp_c=26.8,
            ph=7.12,
            battery_v=3.95,
            battery_pct=88,
            lora_signal_dbm=-75,
            avri_score=22,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Aman dipupuk. Kondisi tanah ideal dengan retensi air optimal.",
            center=[-6.912725, 112.345358],
            polygon=[
                [-6.912540, 112.345250],
                [-6.912540, 112.345465],
                [-6.912910, 112.345465],
                [-6.912910, 112.345250],
            ],
        ),
        BedengParcelDTO(
            id="C2",
            node_id="VS-C1-002",
            name="Blok C2 · Sawah Solokuro Kidul (Selatan-Tengah 1)",
            short_name="C2 · Solokuro Kidul Tengah",
            area_ha=0.08,
            crop_variety="Bisi-2",
            moisture_pct=27.5,
            soil_temp_c=30.4,
            ph=7.48,
            battery_v=3.91,
            battery_pct=85,
            lora_signal_dbm=-77,
            avri_score=48,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada: Tanah mulai hangat. Jika memupuk, tutup pupuk dengan tanah segera.",
            center=[-6.912725, 112.345573],
            polygon=[
                [-6.912540, 112.345465],
                [-6.912540, 112.345680],
                [-6.912910, 112.345680],
                [-6.912910, 112.345465],
            ],
        ),
        BedengParcelDTO(
            id="C3",
            node_id="VS-C1-003",
            name="Blok C3 · Sawah Solokuro Kidul (Selatan-Tengah 2)",
            short_name="C3 · Solokuro Kidul Tengah",
            area_ha=0.08,
            crop_variety="Pioneer P35",
            moisture_pct=21.8,
            soil_temp_c=34.8,
            ph=7.82,
            battery_v=3.87,
            battery_pct=80,
            lora_signal_dbm=-79,
            avri_score=75,
            avri_category="kritis",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="KRITIS! Panas terik dan penguapan cepat. Rekomendasi: Tunda pemupukan.",
            center=[-6.912725, 112.345788],
            polygon=[
                [-6.912540, 112.345680],
                [-6.912540, 112.345895],
                [-6.912910, 112.345895],
                [-6.912910, 112.345680],
            ],
        ),
        BedengParcelDTO(
            id="C4",
            node_id="VS-C1-004",
            name="Blok C4 · Sawah Solokuro Kidul (Selatan-Kelokan Jalan)",
            short_name="C4 · Solokuro Kidul Kelokan",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=18.5,
            soil_temp_c=36.4,
            ph=7.92,
            battery_v=3.82,
            battery_pct=74,
            lora_signal_dbm=-84,
            avri_score=85,
            avri_category="bahaya",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="BAHAYA TINGGI! Pupuk urea akan menguap lebih dari 80%. Dilarang keras melakukan pemupukan sebar.",
            center=[-6.912725, 112.346003],
            polygon=[
                [-6.912540, 112.345895],
                [-6.912540, 112.346110],
                [-6.912910, 112.346110],
                [-6.912910, 112.345895],
            ],
        ),
    ]

def generate_geojson_feature_collection(parcels: List[BedengParcelDTO]) -> Dict[str, Any]:
    """
    Builds a standard RFC 7946 GeoJSON FeatureCollection with [lng, lat] coordinate order
    and rich geospatial properties for GIS inspection.
    """
    features = []
    for p in parcels:
        # RFC 7946 GeoJSON standard requires [longitude, latitude]
        ring = [[coord[1], coord[0]] for coord in p.polygon]
        # Close polygon ring if not already closed
        if ring and ring[0] != ring[-1]:
            ring.append(ring[0])

        features.append({
            "type": "Feature",
            "id": p.id,
            "properties": {
                "parcel_id": p.id,
                "node_id": p.node_id,
                "name": p.name,
                "short_name": p.short_name,
                "area_ha": p.area_ha,
                "crop_variety": p.crop_variety,
                "moisture_pct": p.moisture_pct,
                "soil_temp_c": p.soil_temp_c,
                "ph": p.ph,
                "battery_v": p.battery_v,
                "battery_pct": p.battery_pct,
                "lora_signal_dbm": p.lora_signal_dbm,
                "avri_score": p.avri_score,
                "avri_category": p.avri_category,
                "status": p.status,
                "telemetry_mode": p.telemetry_mode,
                "prescription": p.prescription,
                "center": [p.center[1], p.center[0]]  # [lng, lat]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [ring]
            }
        })

    return {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": features
    }
