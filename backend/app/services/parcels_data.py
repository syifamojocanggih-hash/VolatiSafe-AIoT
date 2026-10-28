from typing import List, Dict, Any
from app.schemas.parcels import BedengParcelDTO, SurroundingParcelDTO, ParcelMapSummaryDTO, SatelliteMetadataDTO

# Real agricultural parcel perimeter from User's Google Earth KML (Divided into 4 sub-parcels)
BLURI_OUTER_BOUNDARY: List[List[float]] = [[-6.902387490913456,112.428935093651],[-6.902638978521811,112.4291244946952],[-6.902744049584672,112.4293768160748],[-6.902907635012112,112.4294517492886],[-6.903149780853113,112.429514930166],[-6.903466934368924,112.4298258820072],[-6.903716732812466,112.4302433304525],[-6.903795039808048,112.4304124543082],[-6.903622454232885,112.4306109109733],[-6.903493158575122,112.4306511649024],[-6.903711249454332,112.4311932510838],[-6.903215597781196,112.4314230651987],[-6.903108414307278,112.431159560912],[-6.903084822033064,112.430988870536],[-6.903385440109569,112.4308769974687],[-6.903315784148513,112.4306769893992],[-6.90297688386421,112.430812203819],[-6.902788215165149,112.430856619753],[-6.902560045565461,112.4309862951754],[-6.902316929149552,112.4309973253622],[-6.902239214894442,112.4309258463116],[-6.902130413826646,112.4306957744132],[-6.902013015186149,112.430627619055],[-6.901841349186837,112.4306960177925],[-6.901786581768945,112.4304273225166],[-6.901878471909425,112.4303342850708],[-6.90195547771863,112.4302884377435],[-6.902092345073013,112.430238389349],[-6.902085268373915,112.4303373580679],[-6.902277291778615,112.4301880678766],[-6.902552390981873,112.4300712294296],[-6.902590188562644,112.4299788659321],[-6.902457562636589,112.4296401434008],[-6.902586809925737,112.4295836515694],[-6.902326825027706,112.4296425742987],[-6.902371848108495,112.4294862153869],[-6.902443845246498,112.4292277182406],[-6.902352408368766,112.4291560518406],[-6.902276639515416,112.4290195824858],[-6.902387490913456,112.428935093651]]
SOLOKURO_OUTER_BOUNDARY = BLURI_OUTER_BOUNDARY
BLURI_SURROUNDING_PARCELS: List[SurroundingParcelDTO] = []
SOLOKURO_SURROUNDING_PARCELS = BLURI_SURROUNDING_PARCELS

def get_initial_12_bedeng_parcels() -> List[BedengParcelDTO]:
    """
    Returns 4 partitioned sub-parcels that seamlessly divide the full KML polygon into 4 zones.
    """
    return [
        BedengParcelDTO(
            id="A1",
            node_id="VS-A1-001",
            name="Sektor 1 · Barat Laut (Zona Barat)",
            short_name="Node 1 (A1)",
            area_ha=0.75,
            crop_variety="Bisi-18",
            moisture_pct=34.5,
            soil_temp_c=28.4,
            ph=7.22,
            battery_v=4.12,
            battery_pct=96,
            lora_signal_dbm=-68,
            avri_score=28,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Kondisi Aman! Kelembaban optimal mendukung penyerapan urea ke perakaran.",
            center=[-6.902575, 112.429808],
            polygon=[[-6.902744,112.429377],[-6.902639,112.429124],[-6.902387,112.428935],[-6.902277,112.42902],[-6.902352,112.429156],[-6.902444,112.429228],[-6.902372,112.429486],[-6.902327,112.429643],[-6.902587,112.429584],[-6.902458,112.42964],[-6.90259,112.429979],[-6.902552,112.430071],[-6.902277,112.430188],[-6.902085,112.430337],[-6.902092,112.430238],[-6.901955,112.430288],[-6.901878,112.430334],[-6.901826,112.430388],[-6.902883,112.430388],[-6.902883,112.429441]],
        ),
        BedengParcelDTO(
            id="A2",
            node_id="VS-A1-002",
            name="Sektor 2 · Timur Laut (Zona Utara)",
            short_name="Node 2 (A2)",
            area_ha=0.6,
            crop_variety="Bisi-18",
            moisture_pct=26.1,
            soil_temp_c=31.8,
            ph=7.55,
            battery_v=3.98,
            battery_pct=88,
            lora_signal_dbm=-71,
            avri_score=52,
            avri_category="waspada",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Waspada! Suhu tanah meningkat. Disarankan pemupukan sore hari atau dengan pembumbunan.",
            center=[-6.902409, 112.430636],
            polygon=[[-6.901787,112.430427],[-6.901841,112.430696],[-6.902013,112.430628],[-6.90213,112.430696],[-6.902239,112.430926],[-6.902317,112.430997],[-6.90256,112.430986],[-6.902788,112.430857],[-6.902883,112.430834],[-6.902883,112.430388],[-6.901826,112.430388]],
        ),
        BedengParcelDTO(
            id="B1",
            node_id="VS-A1-003",
            name="Sektor 3 · Barat Daya (Zona Selatan)",
            short_name="Node 3 (B1)",
            area_ha=0.69,
            crop_variety="Bisi-18",
            moisture_pct=22.4,
            soil_temp_c=34.1,
            ph=7.83,
            battery_v=3.92,
            battery_pct=84,
            lora_signal_dbm=-74,
            avri_score=78,
            avri_category="kritis",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="KRITIS! Suhu terik & kelembaban rendah memicu penguapan amonia kilat. Tunda pemupukan!",
            center=[-6.903222, 112.430014],
            polygon=[[-6.903717,112.430243],[-6.903467,112.429826],[-6.90315,112.429515],[-6.902908,112.429452],[-6.902883,112.429441],[-6.902883,112.430388],[-6.903784,112.430388]],
        ),
        BedengParcelDTO(
            id="B2",
            node_id="VS-A1-004",
            name="Sektor 4 · Tenggara (Zona Timur)",
            short_name="Node 4 (B2)",
            area_ha=0.65,
            crop_variety="Bisi-18",
            moisture_pct=36.2,
            soil_temp_c=27.8,
            ph=7.18,
            battery_v=4.15,
            battery_pct=98,
            lora_signal_dbm=-65,
            avri_score=22,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Kondisi Ideal! Lembab cukup dan suhu sejuk. Waktu aplikasi pupuk sangat direkomendasikan.",
            center=[-6.903319, 112.430809],
            polygon=[[-6.902977,112.430812],[-6.903316,112.430677],[-6.903385,112.430877],[-6.903085,112.430989],[-6.903108,112.43116],[-6.903216,112.431423],[-6.903711,112.431193],[-6.903493,112.430651],[-6.903622,112.430611],[-6.903795,112.430412],[-6.903784,112.430388],[-6.902883,112.430388],[-6.902883,112.430834]],
        ),
    ]

def get_initial_parcel_summary() -> ParcelMapSummaryDTO:
    return ParcelMapSummaryDTO(
        field_id="BLOK-A",
        field_name="Hamparan Lahan Pertanian Blok A · 4 Kuadran Poligon KML",
        farmer_name="Pak Suparman (Poktan Sumber Urip)",
        total_parcels=4,
        active_nodes=4,
        avg_moisture_pct=29.8,
        avg_soil_temp_c=30.5,
        avg_ph=7.44,
        overall_avri_score=45.0,
        overall_avri_category="waspada",
        gateway_distance_km=0.08,
        center_coordinates=[-6.902683, 112.430223],
        gateway_coordinates=[-6.90185, 112.4305],
        outer_boundary=BLURI_OUTER_BOUNDARY,
        surrounding_parcels=[],
        satellite_metadata=SatelliteMetadataDTO(
            provider="Google Earth KML 4-Zone Partition & Esri World Imagery",
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
