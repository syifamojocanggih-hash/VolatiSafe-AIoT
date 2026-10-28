# INTERFACES.md — Sumber Kebenaran Tunggal Kontrak Data VolatiSafe AIoT

> **STATUS:** SUMBER KEBENARAN TUNGGAL (*Single Source of Truth*)  
> Semua skema data yang melintasi batas subsistem (Hardware ↔ Backend, Backend ↔ AI Engine, Backend ↔ Frontend) didefinisikan secara mutlak di sini. Dilarang mendefinisikan bentuk data yang menyimpang dari dokumen ini.

---

## 0. Konvensi Umum & Amplop Respons

### 0.1 HTTP Base URL & Header
- **Dev Backend URL:** `http://localhost:8000/api/v1`
- **WebSocket URL:** `ws://localhost:8000/ws/v1/live`
- **MQTT Broker (Dev):** `localhost:1883`
- **Format:** JSON, `Content-Type: application/json`
- **Timestamp:** ISO 8601 UTC string (`YYYY-MM-DDTHH:MM:SSZ`) untuk REST/WebSocket; Unix Epoch (integer seconds) untuk payload LoRa.

### 0.2 Amplop Respons REST Standar

**Respons Sukses (HTTP 200, 201):**
```json
{
  "data": { /* objek payload tunggal atau array */ },
  "meta": {
    "timestamp": "2026-10-24T16:30:00Z",
    "version": "v1.0"
  }
}
```

**Respons Gagal (HTTP 4xx, 5xx):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Deskripsi kesalahan human-readable",
    "details": {
      "field": "moisture",
      "reason": "Value must be between 0 and 100"
    }
  }
}
```

### 0.3 Kode Error Standar
| `code` | HTTP Status | Keterangan |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Format input tidak valid / di luar batas fisik |
| `NODE_NOT_FOUND` | 404 | Node ID tidak terdaftar di sistem |
| `FIELD_NOT_FOUND` | 404 | ID Petak / Bedeng tidak ditemukan |
| `SENSOR_STALE_DATA` | 422 | Data sensor tidak diperbarui > 2 jam |
| `AI_INFERENCE_FAILED`| 502 | Gagal memanggil modul inferensi (fallback aktif) |
| `INTERNAL_ERROR` | 500 | Kegagalan sistem tak terduga |

---

## 1. Kontrak 1: Hardware ↔ Gateway / Backend (LoRa & MQTT)

### 1.1 Topik MQTT Standar
- **Publikasi Telemetri Node:** `/volatisafe/v1/node/{node_id}/telemetry`
- **Gateway Status (LWT):** `/volatisafe/v1/gateway/{gateway_id}/status`
- **Perintah Konfigurasi Downlink:** `/volatisafe/v1/node/{node_id}/downlink`

### 1.2 Payload LoRa Kompak (ESP32 → LoRa Gateway)
Ukuran payload dijaga ≤ 52 byte untuk efisiensi modulasi LoRa SX1278 (SF7, BW 125 kHz, 433 MHz).

```json
{
  "n": "VS-A1-003",
  "ts": 1792934400,
  "m": 22.4,
  "t": 34.1,
  "ph": 7.83,
  "b": 3.87
}
```

**Definisi Kamus Data:**
| Field | Tipe | Rentang Fisik | Satuan | Deskripsi |
|---|---|---|---|---|
| `n` | string | 6–12 char | — | Node ID fisik (contoh: `"VS-A1-003"`) |
| `ts` | integer | ≥ 1700000000 | detik | Unix timestamp pengambilan data |
| `m` | float | 0.0 – 100.0 | % VWC | Kelembaban tanah kapasitif terkalibrasi |
| `t` | float | -10.0 – 60.0 | °C | Suhu tanah probe DS18B20 |
| `ph` | float | 3.00 – 10.00 | — | Nilai pH tanah terkoreksi kelembaban |
| `b` | float | 2.80 – 4.25 | Volt | Tegangan baterai 18650 aktual |

### 1.3 Payload Telemetri Bersih (Gateway Adapter Output → Ingestion Service)
Setelah melewati Anti-Corruption Adapter di gateway, payload dinormalisasi:

```json
{
  "node_id": "VS-A1-003",
  "recorded_at": "2026-10-24T16:00:00Z",
  "moisture_pct": 22.4,
  "soil_temp_c": 34.1,
  "ph": 7.83,
  "battery_voltage": 3.87,
  "rssi_dbm": -82,
  "snr_db": 9.5,
  "is_predicted": false
}
```

---

## 2. Kontrak 2: Backend ↔ AI Engine & Digital Twin (Inference DTO)

AI Engine diisolasi sebagai callable service / module. Backend mengemas fitur menjadi DTO dan menerima objek prediksi.

### 2.1 Input DTO: `PredictRiskRequestDTO`
```json
{
  "field_id": "BLOK-A",
  "soil_state": {
    "moisture_pct": 22.4,
    "soil_temp_c": 34.1,
    "ph": 7.83
  },
  "weather_forecast_12h": {
    "air_temp_c": 33.5,
    "relative_humidity_pct": 55.0,
    "solar_radiation_mj": 18.4,
    "wind_speed_ms": 2.1,
    "rain_forecast_mm": 0.0
  },
  "agronomic_context": {
    "dat": 32,
    "last_urea_applied_hours_ago": null,
    "target_yield_ton_ha": 8.0
  }
}
```

### 2.2 Output DTO: `PredictRiskResponseDTO`
```json
{
  "avri_score": 74.2,
  "risk_category": "kritis",
  "safe_window_open": false,
  "next_safe_window": {
    "start_time": "2026-10-25T06:00:00Z",
    "end_time": "2026-10-25T09:00:00Z",
    "projected_avri": 18.5,
    "confidence_pct": 88
  },
  "prescription": {
    "action_id": "DELAY_FERTILIZATION",
    "title": "TUNDA PENABURAN UREA",
    "summary": "Potensi kehilangan nitrogen ke udara mencapai 74%. Tanah terlalu panas dan kering.",
    "immediate_guidance": "Tunda hingga besok pagi pukul 06:00 WIB atau lakukan penyiraman pra-aplikasi minimal 2 mm.",
    "shap_explanations": [
      {
        "feature": "soil_temp_c",
        "label": "Suhu Tanah Tinggi (34.1°C)",
        "impact_pct": +38.5,
        "direction": "increases_risk"
      },
      {
        "feature": "moisture_pct",
        "label": "Kelembaban Kering (22.4%)",
        "impact_pct": +26.0,
        "direction": "increases_risk"
      },
      {
        "feature": "ph",
        "label": "pH Tanah Basa (7.83)",
        "impact_pct": +9.7,
        "direction": "increases_risk"
      }
    ]
  },
  "physics_diagnostics": {
    "k_urease_per_hour": 0.428,
    "hydrolysis_rate": 0.312,
    "is_physics_constrained": true
  },
  "model_meta": {
    "version": "piml-lgbm-v1.2",
    "inferred_at": "2026-10-24T16:00:05Z"
  }
}
```

---

## 3. Kontrak 3: Backend ↔ Frontend (REST API & WebSocket)

### 3.1 Daftar Endpoint REST Utama

| Method | Endpoint | Fungsi | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/nodes` | Ringkasan semua node aktif | `?field_id=BLOK-A` |
| `GET` | `/api/v1/nodes/{id}/telemetry` | Deret waktu telemetri petak | `?hours=24` (default 24 jam) |
| `GET` | `/api/v1/fields/{id}/current-status` | Status live petak, skor AVRI & banner | — |
| `GET` | `/api/v1/fields/{id}/forecast-window` | Proyeksi 72 jam jendela pemupukan aman | `?hours=72` |
| `GET` | `/api/v1/fields/{id}/parcels` | Poligon kadastral 12 bedeng & GeoJSON batas satelit | — |
| `POST` | `/api/v1/fields/{id}/parcels/{parcel_id}/simulate-failover` | Memicu/mengembalikan failover Digital Twin FAO-56 pada bedeng | Request Body (opsional) |
| `POST` | `/api/v1/fertilizer/blend-calculator` | Hitung dosis pupuk majemuk & konversi ember | Request Body: Luas lahan, target tonase |
| `POST` | `/api/v1/crop-cycles` | Simpan/ubah tanggal tanam & varietas benih | Request Body: Tanggal tanam, varietas |
| `GET` | `/api/v1/health` | Status gateway, uptime, & sensor status | — |

---

### 3.2 Spesifikasi Detail Endpoint Kunci

#### A. `GET /api/v1/fields/{id}/current-status`
Respons:
```json
{
  "data": {
    "field_id": "BLOK-A",
    "field_name": "Kebun Jagung Pak Suparman · Blok A",
    "farmer_name": "Pak Suparman",
    "block": "Blok A",
    "area_ha": 0.75,
    "crop_age_days": 32,
    "crop_phase": "Fase 8 Vegetatif",
    "corn_variety": "BISI-18",
    "last_updated": "2026-10-24T16:00:00Z",
    "battery_pct": 84,
    "is_simulated_failover": false,
    "metrics": {
      "moisture_pct": 22.4,
      "moisture_delta_24h": -3.2,
      "soil_temp_c": 34.1,
      "soil_temp_delta_24h": 1.8,
      "ph": 7.83,
      "ph_delta_24h": -0.02,
      "avri_score": 74,
      "avri_category": "kritis",
      "avri_delta_24h": -14.0
    },
    "alert_banner": {
      "level": "kritis",
      "color": "#DC2626",
      "headline": "RISIKO KRITIS — AVRI 74%",
      "subheadline": "Jangan tabur Urea sekarang. Potensi penguapan tinggi.",
      "best_window": "Besok 06:00 – 09:00 WIB"
    }
  }
}
```

#### B. `GET /api/v1/fields/{id}/forecast-window`
Menyediakan data bar 72 jam (dibagi per blok 3 jam) untuk visualisasi bar strip di dashboard.
```json
{
  "data": {
    "field_id": "BLOK-A",
    "forecast_hours": 72,
    "windows": [
      {
        "timestamp_start": "2026-10-25T00:00:00Z",
        "timestamp_end": "2026-10-25T03:00:00Z",
        "avri_score": 38.0,
        "risk_category": "waspada",
        "is_safe": false
      },
      {
        "timestamp_start": "2026-10-25T06:00:00Z",
        "timestamp_end": "2026-10-25T09:00:00Z",
        "avri_score": 18.5,
        "risk_category": "aman",
        "is_safe": true
      }
    ]
  }
}
```

#### C. `POST /api/v1/fertilizer/blend-calculator`
**Request:**
```json
{
  "field_area_ha": 0.75,
  "crop_phase_dat": 30,
  "target_yield_ton_ha": 8.0,
  "soil_type": "alkaline_clay"
}
```

**Respons:**
```json
{
  "data": {
    "application_stage": "Pemupukan Susulan I (Fase V8)",
    "recommendation_date": "2026-11-14",
    "pure_nutrients_kg": {
      "nitrogen_n": 46.0,
      "phosphate_p2o5": 11.2,
      "potassium_k2o": 11.2
    },
    "commercial_blend_kg": {
      "urea_kg": 75.0,
      "npk_phonska_kg": 75.0,
      "za_kg": 0.0
    },
    "practical_units": {
      "urea_sacks_50kg": 1.5,
      "npk_sacks_50kg": 1.5,
      "bucket_measure_8kg": 18,
      "instruction_text": "Campurkan 1½ karung Urea dengan 1½ karung Phonska 15-15-15, setara 18 ember takar 8 kg. Tabur di samping rumpun jagung berjarak 7–10 cm."
    }
  }
}
```

#### D. `POST /api/v1/simulation/`
Endpoint pengujian langsung juri untuk mengubah slider parameter cuaca/tanah secara interaktif.
**Request:**
```json
{
  "soil_temp_c": 26.0,
  "moisture_pct": 45.0,
  "ph": 6.8,
  "rain_mm": 15.0
}
```
**Respons:** Mengembalikan `PredictRiskResponseDTO` yang dihitung seketika tanpa mengubah status riil database.

#### E. `GET /api/v1/fields/{id}/parcels`
Menyediakan poligon batas lahan persil kadastral (12 bedeng), outer boundary 16-vertex, metadata citra satelit (Sentinel-2 & UAV Orthomosaic), dan GeoJSON RFC 7946 untuk visualisasi Leaflet GIS.

**Respons Sukses (HTTP 200):**
```json
{
  "data": {
    "field_id": "BLOK-A",
    "field_name": "Hamparan Jagung Blok A - Desa Bluri",
    "center": [-6.89931, 112.43439],
    "zoom": 18,
    "outer_boundary": [
      [-6.89885, 112.43385],
      [-6.89878, 112.43415],
      [-6.89975, 112.43495],
      [-6.89982, 112.43465]
    ],
    "parcels": [
      {
        "id": "A1",
        "name": "Bedeng A1 (Ujung Utara-Barat)",
        "zone": "Zona Utara",
        "crop_age_days": 32,
        "soil_type": "Aluvial Lempung",
        "polygon": [
          [-6.89885, 112.43385],
          [-6.89881, 112.43402],
          [-6.89912, 112.4341],
          [-6.89916, 112.43393]
        ],
        "telemetry": {
          "soil_temp_c": 34.6,
          "moisture_pct": 21.2,
          "ph": 7.85,
          "avri_score": 76.5,
          "risk_category": "kritis",
          "node_id": "VS-A1-001",
          "node_status": "online",
          "signal_rssi_dbm": -81,
          "battery_pct": 92,
          "data_source": "LoRa Live Stream"
        }
      }
    ],
    "surrounding_parcels": [],
    "satellite_metadata": {
      "satellite_source": "Sentinel-2 MultiSpectral (Copernicus) & UAV Orthomosaic",
      "resolution": "0.2m GSD High-Resolution / 10m Multi-Band",
      "last_capture": "2026-10-26T03:15:00Z",
      "ndvi_mean": 0.68,
      "cloud_cover_pct": 2.1,
      "crs": "EPSG:4326 (WGS84)"
    },
    "geojson": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": { "id": "A1", "name": "Bedeng A1", "risk_category": "kritis" },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[112.43385, -6.89885], [112.43402, -6.89881], [112.4341, -6.89912], [112.43393, -6.89916], [112.43385, -6.89885]]]
          }
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2026-10-27T16:55:00Z",
    "version": "v1.0"
  }
}
```

#### F. `POST /api/v1/fields/{id}/parcels/{parcel_id}/simulate-failover`
Memicu simulasi pemutusan node LoRa fisik pada bedeng persil tertentu dan mengalihkan estimasi data ke model Digital Twin Biofisik FAO-56. Memanggil endpoint ini kembali akan memulihkan node ke mode `online`.

**Request Body (Opsional):**
```json
{
  "node_id": "VS-A1-001",
  "force_failover": true
}
```

**Respons Sukses (HTTP 200):**
```json
{
  "data": {
    "parcel_id": "A1",
    "node_id": "VS-A1-001",
    "node_status": "simulated",
    "data_source": "[Est-Simulated] FAO-56",
    "is_simulated_failover": true,
    "soil_temp_c": 34.6,
    "moisture_pct": 21.2,
    "message": "Node VS-A1-001 dialihkan ke estimasi Digital Twin FAO-56"
  },
  "meta": {
    "timestamp": "2026-10-27T16:55:00Z",
    "version": "v1.0"
  }
}
```

---

### 3.3 Kontrak WebSocket: `/ws/v1/live`

Klien frontend melakukan koneksi WebSocket untuk mendengarkan siaran live update tanpa polling.

**Pesan Masuk (Server → Frontend):**
```json
{
  "event": "TELEMETRY_UPDATE",
  "data": {
    "node_id": "VS-A1-003",
    "field_id": "BLOK-A",
    "timestamp": "2026-10-24T16:15:00Z",
    "moisture_pct": 22.1,
    "soil_temp_c": 34.3,
    "ph": 7.84,
    "avri_score": 75.1,
    "risk_category": "kritis",
    "is_predicted": false
  }
}
```

Event cadangan:
- `"ALERT_TRIGGERED"`: Saat skor AVRI melompat melewati ambang batas Kritis (> 60%).
- `"FAILOVER_ACTIVATED"`: Saat sensor offline dan Digital Twin mengambil alih imputasi data.
