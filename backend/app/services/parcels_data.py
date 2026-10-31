from typing import List, Dict, Any
from app.schemas.parcels import BedengParcelDTO, SurroundingParcelDTO, ParcelMapSummaryDTO, SatelliteMetadataDTO

# Real agricultural parcel perimeter from User's Google Earth KML (Divided into 5 sub-parcels)
BLURI_OUTER_BOUNDARY: List[List[float]] = [
    [-6.902387490913456, 112.428935093651],
    [-6.902638978521811, 112.4291244946952],
    [-6.902744049584672, 112.4293768160748],
    [-6.902907635012112, 112.4294517492886],
    [-6.903149780853113, 112.429514930166],
    [-6.903466934368924, 112.4298258820072],
    [-6.903716732812466, 112.4302433304525],
    [-6.903795039808048, 112.4304124543082],
    [-6.903622454232885, 112.4306109109733],
    [-6.903493158575122, 112.4306511649024],
    [-6.903711249454332, 112.4311932510838],
    [-6.903215597781196, 112.4314230651987],
    [-6.903108414307278, 112.431159560912],
    [-6.903084822033064, 112.430988870536],
    [-6.903385440109569, 112.4308769974687],
    [-6.903315784148513, 112.4306769893992],
    [-6.90297688386421, 112.430812203819],
    [-6.902788215165149, 112.430856619753],
    [-6.902560045565461, 112.4309862951754],
    [-6.902316929149552, 112.4309973253622],
    [-6.902239214894442, 112.4309258463116],
    [-6.902130413826646, 112.4306957744132],
    [-6.902013015186149, 112.430627619055],
    [-6.901841349186837, 112.4306960177925],
    [-6.901786581768945, 112.4304273225166],
    [-6.901878471909425, 112.4303342850708],
    [-6.90195547771863, 112.4302884377435],
    [-6.902092345073013, 112.430238389349],
    [-6.902085268373915, 112.4303373580679],
    [-6.902277291778615, 112.4301880678766],
    [-6.902552390981873, 112.4300712294296],
    [-6.902590188562644, 112.4299788659321],
    [-6.902457562636589, 112.4296401434008],
    [-6.902586809925737, 112.4295836515694],
    [-6.902326825027706, 112.4296425742987],
    [-6.902371848108495, 112.4294862153869],
    [-6.902443845246498, 112.4292277182406],
    [-6.902352408368766, 112.4291560518406],
    [-6.902276639515416, 112.4290195824858],
    [-6.902387490913456, 112.428935093651]
]
SOLOKURO_OUTER_BOUNDARY = BLURI_OUTER_BOUNDARY
BLURI_SURROUNDING_PARCELS: List[SurroundingParcelDTO] = []
SOLOKURO_SURROUNDING_PARCELS = BLURI_SURROUNDING_PARCELS

def get_initial_12_bedeng_parcels() -> List[BedengParcelDTO]:
    """
    Returns 5 partitioned sub-parcels that seamlessly divide the full KML polygon into 5 zones,
    100% synchronized with the 5 master IoT nodes in mock_db and Admin page.
    """
    return [
        BedengParcelDTO(
            id="A1",
            node_id="VS-A1-001",
            name="Sektor 1 · Blok A1 (Utara Atas / Barat)",
            short_name="Node 1 (A1)",
            area_ha=0.41,
            crop_variety="Bisi-18",
            moisture_pct=22.4,
            soil_temp_c=34.1,
            ph=7.83,
            battery_v=3.92,
            battery_pct=88,
            lora_signal_dbm=-82,
            avri_score=78,
            avri_category="kritis",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="KRITIS! Suhu terik 34,1°C & kelembaban 22,4% memicu penguapan amonia kilat. Tunda pemupukan!",
            center=[-6.902598, 112.429489],
            polygon=[
                [-6.902639, 112.429124],
                [-6.902744, 112.429377],
                [-6.90285, 112.429425],
                [-6.90285, 112.42995],
                [-6.902579, 112.42995],
                [-6.902458, 112.42964],
                [-6.902587, 112.429584],
                [-6.902327, 112.429643],
                [-6.902372, 112.429486],
                [-6.902444, 112.429228],
                [-6.902352, 112.429156],
                [-6.902277, 112.42902],
                [-6.902387, 112.428935]
            ],
        ),
        BedengParcelDTO(
            id="A2",
            node_id="VS-A1-002",
            name="Sektor 2 · Blok A2 (Tengah Lembah / Inti 1)",
            short_name="Node 2 (A2)",
            area_ha=0.58,
            crop_variety="Bisi-18",
            moisture_pct=36.8,
            soil_temp_c=26.4,
            ph=7.10,
            battery_v=4.01,
            battery_pct=94,
            lora_signal_dbm=-71,
            avri_score=24,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Kondisi Optimal! Suhu sejuk 26,4°C & kelembaban 36,8% mendukung penyerapan urea ke perakaran.",
            center=[-6.902421, 112.430353],
            polygon=[
                [-6.901787, 112.430427],
                [-6.901878, 112.430334],
                [-6.901955, 112.430288],
                [-6.902092, 112.430238],
                [-6.902085, 112.430337],
                [-6.902277, 112.430188],
                [-6.902552, 112.430071],
                [-6.90259, 112.429979],
                [-6.902579, 112.42995],
                [-6.90285, 112.42995],
                [-6.90285, 112.4306],
                [-6.901822, 112.4306]
            ],
        ),
        BedengParcelDTO(
            id="A3",
            node_id="VS-A1-003",
            name="Sektor 3 · Blok A3 (Timur / Sisi Jalan)",
            short_name="Node 3 (A3)",
            area_ha=0.31,
            crop_variety="Bisi-18",
            moisture_pct=19.2,
            soil_temp_c=36.0,
            ph=7.89,
            battery_v=3.85,
            battery_pct=78,
            lora_signal_dbm=-79,
            avri_score=84,
            avri_category="kritis",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="WASPADA TINGGI! Area tepi jalan dengan suhu 36°C & kelembaban 19,2%. Sangat rawan volatilisasi amonia.",
            center=[-6.902453, 112.430761],
            polygon=[
                [-6.902788, 112.430857],
                [-6.90256, 112.430986],
                [-6.902317, 112.430997],
                [-6.902239, 112.430926],
                [-6.90213, 112.430696],
                [-6.902013, 112.430628],
                [-6.901841, 112.430696],
                [-6.901822, 112.4306],
                [-6.90285, 112.4306],
                [-6.90285, 112.430842]
            ],
        ),
        BedengParcelDTO(
            id="B1",
            node_id="VS-B1-004",
            name="Sektor 4 · Blok B1 (Selatan Irigasi)",
            short_name="Node 4 (B1)",
            area_ha=0.73,
            crop_variety="Bisi-18",
            moisture_pct=41.2,
            soil_temp_c=26.8,
            ph=6.80,
            battery_v=3.98,
            battery_pct=91,
            lora_signal_dbm=-68,
            avri_score=18,
            avri_category="aman",
            status="online",
            telemetry_mode="LoRa Live Stream",
            prescription="Kondisi Ideal! Lembab optimal 41,2% dari saluran irigasi. Waktu aplikasi pupuk sangat direkomendasikan.",
            center=[-6.903203, 112.430008],
            polygon=[
                [-6.902908, 112.429452],
                [-6.90315, 112.429515],
                [-6.903467, 112.429826],
                [-6.903717, 112.430243],
                [-6.903784, 112.430388],
                [-6.90285, 112.430388],
                [-6.90285, 112.429425]
            ],
        ),
        BedengParcelDTO(
            id="B2",
            node_id="VS-B2-005",
            name="Sektor 5 · Blok B2 (Lereng Selatan)",
            short_name="Node 5 (B2)",
            area_ha=0.67,
            crop_variety="Bisi-18",
            moisture_pct=28.5,
            soil_temp_c=30.2,
            ph=7.45,
            battery_v=3.55,
            battery_pct=62,
            lora_signal_dbm=-94,
            avri_score=48,
            avri_category="waspada",
            status="simulated",
            telemetry_mode="[Est-Simulated] FAO-56",
            prescription="Estimasi Digital Twin FAO-56: Node offline, estimasi kelembaban 28,5% dengan risiko volatilisasi sedang.",
            center=[-6.903307, 112.430804],
            polygon=[
                [-6.903795, 112.430412],
                [-6.903622, 112.430611],
                [-6.903493, 112.430651],
                [-6.903711, 112.431193],
                [-6.903216, 112.431423],
                [-6.903108, 112.43116],
                [-6.903085, 112.430989],
                [-6.903385, 112.430877],
                [-6.903316, 112.430677],
                [-6.902977, 112.430812],
                [-6.90285, 112.430842],
                [-6.90285, 112.430388],
                [-6.903784, 112.430388]
            ],
        ),
    ]

def get_initial_parcel_summary() -> ParcelMapSummaryDTO:
    return ParcelMapSummaryDTO(
        coordinates_text='6°54\'10"S 112°25\'49"E',
        soil_type_text='Hamparan Lahan Pertanian Jagung (Delimitasi Poligon KML · Aluvial Karst Subur pH 7.4)',
        gateway_distance_km=0.08,
        total_area_ha=2.70,
        center_coordinates=[-6.902683, 112.430223],
        gateway_coordinates=[-6.901850, 112.430500],
        outer_boundary=BLURI_OUTER_BOUNDARY,
        surrounding_parcels=[],
        satellite_metadata=SatelliteMetadataDTO(
            source="Google Earth KML 5-Zone Partition & Esri World Imagery",
            resolution="0.3m GSD High-Resolution Optical Aerial Orthophoto",
            crs="EPSG:4326 (WGS84)",
            last_capture="2026-10-25T08:45:00Z",
            ndvi_mean=0.74,
            ndwi_mean=0.31,
            cloud_cover_pct=1.8
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
