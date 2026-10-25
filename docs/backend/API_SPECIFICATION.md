# API_SPECIFICATION.md — Spesifikasi REST API FastAPI

---

## 1. Konvensi Global

- **Base URL:** `http://localhost:8000/api/v1`
- **Format:** `application/json` (UTF-8)
- **Amplop:** Selalu dibungkus objek `{"data": ...}` untuk sukses dan `{"error": ...}` untuk kegagalan (lihat [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §0).

---

## 2. Rincian Endpoint

### 2.1 `GET /nodes`
Mengambil daftar seluruh node sensor yang terdaftar beserta status baterai dan koneksi terakhir.
- **Query Params:** `field_id` (opsional, string).
- **Contoh Respons (HTTP 200):**
```json
{
  "data": [
    {
      "node_id": "VS-A1-003",
      "field_id": "BLOK-A",
      "firmware_ver": "v1.0.2-prod",
      "battery_v": 3.87,
      "battery_pct": 84,
      "last_seen": "2026-10-24T16:00:00Z",
      "status": "online"
    }
  ]
}
```

---

### 2.2 `GET /nodes/{node_id}/telemetry`
Mengambil deret waktu telemetri sensor untuk grafik historis.
- **Path Params:** `node_id` (string).
- **Query Params:** `hours` (integer, default: 24, max: 168).
- **Contoh Respons (HTTP 200):**
```json
{
  "data": {
    "node_id": "VS-A1-003",
    "hours_requested": 24,
    "points_count": 96,
    "series": [
      {
        "timestamp": "2026-10-24T15:45:00Z",
        "moisture_pct": 22.8,
        "soil_temp_c": 33.8,
        "ph": 7.82,
        "battery_voltage": 3.88,
        "is_predicted": false
      },
      {
        "timestamp": "2026-10-24T16:00:00Z",
        "moisture_pct": 22.4,
        "soil_temp_c": 34.1,
        "ph": 7.83,
        "battery_voltage": 3.87,
        "is_predicted": false
      }
    ]
  }
}
```

---

### 2.3 `GET /fields/{field_id}/current-status`
Menyediakan agregasi status terkini petak untuk kartu ringkasan Dashboard Petak (Layar 1).
- **Contoh Respons (HTTP 200):**
```json
{
  "data": {
    "field_id": "BLOK-A",
    "field_name": "Kebun Jagung Pak Suparman · Blok A",
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
      "avri_category": "kritis"
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

---

### 2.4 `POST /fertilizer/blend-calculator`
Menghitung takaran campuran pupuk majemuk (Urea + Phonska + ZA) dan mengonversinya ke satuan praktis karung & ember.
- **Request Body:**
```json
{
  "field_area_ha": 0.75,
  "crop_phase_dat": 30,
  "target_yield_ton_ha": 8.0,
  "soil_type": "clay_alkaline"
}
```
- **Contoh Respons (HTTP 200):**
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

---

### 2.5 `POST /crop-cycles`
Inisiasi atau pembaruan siklus tanam aktif untuk menghitung umur tanaman (*Days After Transplanting / DAT*) dan menjadwalkan notifikasi H-3 persiapan pemupukan.
- **Request Body:**
```json
{
  "field_id": "BLOK-A",
  "planting_date": "2026-11-01",
  "seed_variety": "BISI-18",
  "field_area_ha": 0.75,
  "target_yield_ton_ha": 8.0
}
```
- **Contoh Respons (HTTP 201):**
```json
{
  "data": {
    "cycle_id": "CYC-2026-001",
    "field_id": "BLOK-A",
    "planting_date": "2026-11-01",
    "current_dat": 0,
    "growth_stage": "Fase Perkecambahan (VE)",
    "milestones": [
      {
        "phase": "Fase V3 (Pemupukan Dasar)",
        "target_dat": 12,
        "calendar_date": "2026-11-13",
        "h3_alert_date": "2026-11-10",
        "action_required": "Tebus 2 karung Phonska + 1/2 karung Urea"
      },
      {
        "phase": "Fase V8 (Pemupukan Susulan I)",
        "target_dat": 32,
        "calendar_date": "2026-12-03",
        "h3_alert_date": "2026-11-30",
        "action_required": "Tebus 2 karung Urea + 1/2 karung Phonska"
      },
      {
        "phase": "Estimasi Panen Fisiologis (R6)",
        "target_dat": 105,
        "calendar_date": "2027-02-14",
        "h3_alert_date": "2027-02-11",
        "action_required": "Persiapan pengeringan terpal & panen"
      }
    ]
  }
}
```

---

