from typing import List, Dict, Any
from app.schemas.parcels import BedengParcelDTO, SurroundingParcelDTO, ParcelMapSummaryDTO, SatelliteMetadataDTO

# Real agricultural parcel perimeter (Hamparan Sawah Tegal Jagung Blok A - Desa Bluri, Solokuro, Lamongan)
# Authenticated agricultural cropland: -6.915000, 112.422000 (Jauh dari area tambang bukit kapur)
BLURI_OUTER_BOUNDARY: List[List[float]] = [
    [-6.914100, 112.420900],
    [-6.914100, 112.423150],
    [-6.915850, 112.423150],
    [-6.915850, 112.420900]
]
SOLOKURO_OUTER_BOUNDARY = BLURI_OUTER_BOUNDARY

# Surrounding agricultural buffer fields (Hamparan sawah padi & jagung Desa Bluri)
BLURI_SURROUNDING_PARCELS: List[SurroundingParcelDTO] = [
    SurroundingParcelDTO(
        id="C01",
        name="Lahan Sawah Bluri Lor (Utara Jalan Tani)",
        area_ha=0.55,
        center=[-6.913700, 112.422000],
        polygon=[
            [-6.913300, 112.420900],
            [-6.913300, 112.423150],
            [-6.914100, 112.423150],
            [-6.914100, 112.420900]
        ]
    ),
    SurroundingParcelDTO(
        id="C02",
        name="Lahan Pertanian Bluri Kulon (Arah Saluran Primer)",
        area_ha=0.68,
        center=[-6.915000, 112.420200],
        polygon=[
            [-6.914100, 112.419500],
            [-6.914100, 112.420900],
            [-6.915850, 112.420900],
            [-6.915850, 112.419500]
        ]
    ),
    SurroundingParcelDTO(
        id="C03",
        name="Lahan Sawah Bluri Kidul (Arah Balai Desa)",
        area_ha=0.62,
        center=[-6.916300, 112.422000],
        polygon=[
            [-6.915850, 112.420900],
            [-6.915850, 112.423150],
            [-6.916700, 112.423150],
            [-6.916700, 112.420900]
        ]
    ),
    SurroundingParcelDTO(
        id="C04",
        name="Persil Sawah Wetan (Batas Pematang Irigasi)",
        area_ha=0.58,
        center=[-6.915000, 112.423800],
        polygon=[
            [-6.914100, 112.423150],
            [-6.914100, 112.424500],
            [-6.915850, 112.424500],
            [-6.915850, 112.423150]
        ]
    )
]
SOLOKURO_SURROUNDING_PARCELS = BLURI_SURROUNDING_PARCELS

def get_initial_12_bedeng_parcels() -> List[BedengParcelDTO]:
    """
    Returns 12 high-precision agricultural bedeng parcels across Blok A, B, and C
    in true cropland of Desa Bluri, Solokuro, Lamongan (-6.915000, 112.422000).
    Grid structure: 3 Rows x 4 Columns = 12 Bedeng Sawah, spaced ~55m apart.
    """
    return [
        # === TIER A: UTARA (Baris Utara 1..4) ===
        BedengParcelDTO(
            id="A1",
            node_id="VS-A1-001",
            name="Blok A1 · Sawah Bluri Lor 1 (Utara-Barat)",
            short_name="A1 · Bluri Lor Barat",
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
            center=[-6.914480, 112.421280],
            polygon=[
                [-6.914300, 112.421100],
                [-6.914300, 112.421460],
                [-6.914660, 112.421460],
                [-6.914660, 112.421100],
            ],
        ),
        BedengParcelDTO(
            id="A2",
            node_id="VS-A1-002",
            name="Blok A2 · Sawah Bluri Lor 2 (Utara-Tengah)",
            short_name="A2 · Bluri Lor Tengah",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=23.1,
            soil_temp_c=33.8,
            ph=7.81,
            battery_v=3.89,
            battery_pct=81,
            lora_signal_dbm=-78,
            avri_score=71,
            avri_category="kritis",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Peringatan Kritis! Risiko volatilisasi amonia 71%. Tunda penaburan pupuk urea hingga sore.",
            center=[-6.914480, 112.421780],
            polygon=[
                [-6.914300, 112.421600],
                [-6.914300, 112.421960],
                [-6.914660, 112.421960],
                [-6.914660, 112.421600],
            ],
        ),
        BedengParcelDTO(
            id="A3",
            node_id="VS-A1-003",
            name="Blok A3 · Sawah Bluri Lor 3 (Utara-Timur)",
            short_name="A3 · Bluri Lor Timur",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=26.8,
            soil_temp_c=31.4,
            ph=7.62,
            battery_v=4.01,
            battery_pct=91,
            lora_signal_dbm=-72,
            avri_score=54,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada! Siram bedeng sebelum penaburan pupuk untuk menekan penguapan amonia.",
            center=[-6.914480, 112.422280],
            polygon=[
                [-6.914300, 112.422100],
                [-6.914300, 112.422460],
                [-6.914660, 112.422460],
                [-6.914660, 112.422100],
            ],
        ),
        BedengParcelDTO(
            id="A4",
            node_id="VS-A1-004",
            name="Blok A4 · Sawah Bluri Lor 4 (Sudut Timur)",
            short_name="A4 · Bluri Lor Sudut",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=27.2,
            soil_temp_c=30.9,
            ph=7.58,
            battery_v=3.95,
            battery_pct=87,
            lora_signal_dbm=-75,
            avri_score=49,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada! Risiko volatilisasi 49%. Direkomendasikan pemupukan sore pukul 15:30 - 17:00.",
            center=[-6.914480, 112.422780],
            polygon=[
                [-6.914300, 112.422600],
                [-6.914300, 112.422960],
                [-6.914660, 112.422960],
                [-6.914660, 112.422600],
            ],
        ),

        # === TIER B: TENGAH (Baris Tengah 1..4) ===
        BedengParcelDTO(
            id="B1",
            node_id="VS-A1-005",
            name="Blok B1 · Sawah Bluri Tengah 1 (Tengah-Barat)",
            short_name="B1 · Bluri Tengah Barat",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=34.2,
            soil_temp_c=28.7,
            ph=7.32,
            battery_v=4.08,
            battery_pct=95,
            lora_signal_dbm=-68,
            avri_score=28,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Aman untuk tebar! Kelembaban tanah cukup tinggi (34,2%) dan suhu sejuk (28,7°C).",
            center=[-6.914980, 112.421280],
            polygon=[
                [-6.914800, 112.421100],
                [-6.914800, 112.421460],
                [-6.915160, 112.421460],
                [-6.915160, 112.421100],
            ],
        ),
        BedengParcelDTO(
            id="B2",
            node_id="VS-A1-006",
            name="Blok B2 · Sawah Bluri Tengah 2 (Sentral Petak)",
            short_name="B2 · Bluri Sentral Inti",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=36.0,
            soil_temp_c=27.9,
            ph=7.25,
            battery_v=4.12,
            battery_pct=98,
            lora_signal_dbm=-65,
            avri_score=22,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Jendela Pemupukan Optimal! Risiko penguapan amonia sangat rendah (22%). Segera lakukan penaburan.",
            center=[-6.914980, 112.421780],
            polygon=[
                [-6.914800, 112.421600],
                [-6.914800, 112.421960],
                [-6.915160, 112.421960],
                [-6.915160, 112.421600],
            ],
        ),
        BedengParcelDTO(
            id="B3",
            node_id="VS-A1-007",
            name="Blok B3 · Sawah Bluri Tengah 3 (Tengah-Timur)",
            short_name="B3 · Bluri Tengah Timur",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=33.5,
            soil_temp_c=29.1,
            ph=7.38,
            battery_v=3.98,
            battery_pct=89,
            lora_signal_dbm=-71,
            avri_score=31,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada! Kondisi batas aman. Tabur segera sebelum terik matahari siang meningkat.",
            center=[-6.914980, 112.422280],
            polygon=[
                [-6.914800, 112.422100],
                [-6.914800, 112.422460],
                [-6.915160, 112.422460],
                [-6.915160, 112.422100],
            ],
        ),
        BedengParcelDTO(
            id="B4",
            node_id="VS-A1-008",
            name="Blok B4 · Sawah Bluri Tengah 4 (Sisi Irigasi)",
            short_name="B4 · Bluri Saluran Irigasi",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=38.4,
            soil_temp_c=27.2,
            ph=7.18,
            battery_v=4.15,
            battery_pct=100,
            lora_signal_dbm=-64,
            avri_score=19,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Kondisi Sangat Aman! Difusi urea lancar, penguapan amonia minimal (19%).",
            center=[-6.914980, 112.422780],
            polygon=[
                [-6.914800, 112.422600],
                [-6.914800, 112.422960],
                [-6.915160, 112.422960],
                [-6.915160, 112.422600],
            ],
        ),

        # === TIER C: SELATAN (Baris Selatan 1..4) ===
        BedengParcelDTO(
            id="C1",
            node_id="VS-A1-009",
            name="Blok C1 · Sawah Bluri Kidul 1 (Selatan-Barat)",
            short_name="C1 · Bluri Kidul Barat",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=31.0,
            soil_temp_c=30.2,
            ph=7.45,
            battery_v=3.91,
            battery_pct=83,
            lora_signal_dbm=-77,
            avri_score=42,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada! Disarankan menutup pupuk urea dengan tanah atau irigasi tipis.",
            center=[-6.915480, 112.421280],
            polygon=[
                [-6.915300, 112.421100],
                [-6.915300, 112.421460],
                [-6.915660, 112.421460],
                [-6.915660, 112.421100],
            ],
        ),
        BedengParcelDTO(
            id="C2",
            node_id="VS-A1-010",
            name="Blok C2 · Sawah Bluri Kidul 2 (Selatan-Tengah)",
            short_name="C2 · Bluri Kidul Tengah",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=35.1,
            soil_temp_c=28.3,
            ph=7.29,
            battery_v=4.05,
            battery_pct=93,
            lora_signal_dbm=-69,
            avri_score=25,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Aman untuk tebar! Waktu penyerapan nitrogen optimal.",
            center=[-6.915480, 112.421780],
            polygon=[
                [-6.915300, 112.421600],
                [-6.915300, 112.421960],
                [-6.915660, 112.421960],
                [-6.915660, 112.421600],
            ],
        ),
        BedengParcelDTO(
            id="C3",
            node_id="VS-A1-011",
            name="Blok C3 · Sawah Bluri Kidul 3 (Selatan-Timur)",
            short_name="C3 · Bluri Kidul Timur",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=29.4,
            soil_temp_c=31.8,
            ph=7.68,
            battery_v=3.88,
            battery_pct=80,
            lora_signal_dbm=-79,
            avri_score=58,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada! Suhu tanah meningkat. Tunda penaburan hingga cuaca lebih sejuk.",
            center=[-6.915480, 112.422280],
            polygon=[
                [-6.915300, 112.422100],
                [-6.915300, 112.422460],
                [-6.915660, 112.422460],
                [-6.915660, 112.422100],
            ],
        ),
        BedengParcelDTO(
            id="C4",
            node_id="VS-A1-012",
            name="Blok C4 · Sawah Bluri Kidul 4 (Dekat Balai Desa)",
            short_name="C4 · Bluri Pintu Masuk",
            area_ha=0.08,
            crop_variety="Bisi-18",
            moisture_pct=32.8,
            soil_temp_c=29.6,
            ph=7.41,
            battery_v=4.02,
            battery_pct=91,
            lora_signal_dbm=-67,
            avri_score=33,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada Ringan! Penaburan pupuk dapat dilakukan jika disertai pembumbunan tanah.",
            center=[-6.915480, 112.422780],
            polygon=[
                [-6.915300, 112.422600],
                [-6.915300, 112.422960],
                [-6.915660, 112.422960],
                [-6.915660, 112.422600],
            ],
        ),
    ]

def get_initial_parcel_summary() -> ParcelMapSummaryDTO:
    return ParcelMapSummaryDTO(
        field_id="BLOK-A",
        field_name="Hamparan Sawah Tegal Jagung Blok A · Desa Bluri, Solokuro",
        farmer_name="Pak Suparman (Poktan Sumber Urip)",
        total_parcels=12,
        active_nodes=12,
        avg_moisture_pct=29.5,
        avg_soil_temp_c=30.6,
        avg_ph=7.52,
        overall_avri_score=42.4,
        overall_avri_category="waspada",
        gateway_distance_km=0.32,
        center_coordinates=[-6.915000, 112.422000],
        gateway_coordinates=[-6.917200, 112.420000],
        outer_boundary=BLURI_OUTER_BOUNDARY,
        satellite_metadata=SatelliteMetadataDTO(
            provider="Google Hybrid Satellite & Esri World Imagery",
            capture_date="2026-10-25",
            cloud_cover_pct=1.8,
            resolution_m=0.3,
            sensor="High-Resolution Optical Aerial Orthophoto"
        )
    )

def generate_geojson_feature_collection(parcels: List[BedengParcelDTO]) -> Dict[str, Any]:
    features = []
    for p in parcels:
        ring = [[round(coord[1], 6), round(coord[0], 6)] for coord in p.polygon]
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
                "center": [round(p.center[1], 6), round(p.center[0], 6)]
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

