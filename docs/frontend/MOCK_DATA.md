# MOCK_DATA.md — Fixture Mock Data Offline untuk Pengembangan Frontend

> **PANDUAN MANDIRI FRONTEND:**  
> Seluruh JSON di bawah ini adalah data tiruan resmi yang mematuhi kontrak [`docs/universal/INTERFACES.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/universal/INTERFACES.md). Frontend AI **dapat mengembangkan seluruh layar dan visualisasi 100% tuntas** menggunakan data ini tanpa perlu menjalankan server backend, database, maupun hardware IoT.

---

## 1. Fixture: `GET /api/v1/fields/BLOK-A/current-status`

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
      "subheadline": "Jangan tabur Urea sekarang. Potensi penguapan amonia tinggi.",
      "best_window": "Besok Pagi, 06:00 – 09:00 WIB (Risiko 18%)"
    },
    "shap_explanations": [
      {
        "feature": "soil_temp_c",
        "label": "Suhu Tanah Panas (34.1°C)",
        "impact_pct": 38.5,
        "direction": "increases_risk",
        "explanation": "Suhu tanah sangat terik (34.1°C) memicu penguraian cepat enzim urease"
      },
      {
        "feature": "moisture_pct",
        "label": "Tanah Kering (22.4%)",
        "impact_pct": 26.0,
        "direction": "increases_risk",
        "explanation": "Tanah terlalu kering (22.4%), butiran Urea tidak dapat larut ke perakaran"
      },
      {
        "feature": "ph",
        "label": "pH Tanah Basa (7.83)",
        "impact_pct": 9.7,
        "direction": "increases_risk",
        "explanation": "Tanah berkapur/basa (pH 7.83) mempercepat pelepasan gas amonia bebas"
      }
    ]
  }
}
```

---

## 2. Fixture: `GET /api/v1/nodes/VS-A1-003/telemetry?hours=24`

```json
{
  "data": {
    "node_id": "VS-A1-003",
    "hours_requested": 24,
    "points_count": 8,
    "series": [
      { "timestamp": "2026-10-24T00:00:00Z", "moisture_pct": 25.1, "soil_temp_c": 26.2, "ph": 7.81, "battery_voltage": 3.90, "is_predicted": false },
      { "timestamp": "2026-10-24T03:00:00Z", "moisture_pct": 24.8, "soil_temp_c": 25.4, "ph": 7.81, "battery_voltage": 3.89, "is_predicted": false },
      { "timestamp": "2026-10-24T06:00:00Z", "moisture_pct": 24.5, "soil_temp_c": 26.8, "ph": 7.82, "battery_voltage": 3.89, "is_predicted": false },
      { "timestamp": "2026-10-24T09:00:00Z", "moisture_pct": 23.7, "soil_temp_c": 31.0, "ph": 7.82, "battery_voltage": 3.92, "is_predicted": false },
      { "timestamp": "2026-10-24T12:00:00Z", "moisture_pct": 22.8, "soil_temp_c": 34.6, "ph": 7.83, "battery_voltage": 3.94, "is_predicted": false },
      { "timestamp": "2026-10-24T14:00:00Z", "moisture_pct": 22.5, "soil_temp_c": 34.8, "ph": 7.83, "battery_voltage": 3.91, "is_predicted": false },
      { "timestamp": "2026-10-24T15:00:00Z", "moisture_pct": 22.4, "soil_temp_c": 34.3, "ph": 7.83, "battery_voltage": 3.88, "is_predicted": false },
      { "timestamp": "2026-10-24T16:00:00Z", "moisture_pct": 22.4, "soil_temp_c": 34.1, "ph": 7.83, "battery_voltage": 3.87, "is_predicted": false }
    ]
  }
}
```

---

## 3. Fixture: `GET /api/v1/fields/BLOK-A/forecast-window?hours=72`

```json
{
  "data": {
    "field_id": "BLOK-A",
    "forecast_hours": 72,
    "windows": [
      { "timestamp_start": "2026-10-24T18:00:00Z", "timestamp_end": "2026-10-24T21:00:00Z", "avri_score": 45.0, "risk_category": "waspada", "is_safe": false },
      { "timestamp_start": "2026-10-24T21:00:00Z", "timestamp_end": "2026-10-25T00:00:00Z", "avri_score": 38.0, "risk_category": "waspada", "is_safe": false },
      { "timestamp_start": "2026-10-25T00:00:00Z", "timestamp_end": "2026-10-25T03:00:00Z", "avri_score": 28.0, "risk_category": "aman", "is_safe": true },
      { "timestamp_start": "2026-10-25T03:00:00Z", "timestamp_end": "2026-10-25T06:00:00Z", "avri_score": 22.0, "risk_category": "aman", "is_safe": true },
      { "timestamp_start": "2026-10-25T06:00:00Z", "timestamp_end": "2026-10-25T09:00:00Z", "avri_score": 18.5, "risk_category": "aman", "is_safe": true },
      { "timestamp_start": "2026-10-25T09:00:00Z", "timestamp_end": "2026-10-25T12:00:00Z", "avri_score": 68.0, "risk_category": "kritis", "is_safe": false },
      { "timestamp_start": "2026-10-25T12:00:00Z", "timestamp_end": "2026-10-25T15:00:00Z", "avri_score": 79.0, "risk_category": "kritis", "is_safe": false },
      { "timestamp_start": "2026-10-25T15:00:00Z", "timestamp_end": "2026-10-25T18:00:00Z", "avri_score": 62.0, "risk_category": "kritis", "is_safe": false }
    ]
  }
}
```

---

## 4. Fixture: `POST /api/v1/fertilizer/blend-calculator`

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
