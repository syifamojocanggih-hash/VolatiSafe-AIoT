# EXPLAINABILITY_SHAP.md — Spesifikasi Explainable AI (TreeSHAP)

---

## 1. Urgensi Explainable AI dalam Pertanian

Petani dan Penyuluh Pertanian Lapangan (PPL) tidak akan pernah mematuhi rekomendasi "JANGAN TABUR UREA" jika sistem hanya menyajikan angka *black-box* tanpa alasan logis.

Melalui modul **TreeSHAP (*SHapley Additive exPlanations*)**, VolatiSafe AIoT membedah kontribusi setiap parameter mikroklimat tanah terhadap skor AVRI yang dihasilkan, lalu menerjemahkannya secara otomatis ke dalam **narasi bahasa Indonesia yang praktis**.

---

## 2. Pipeline Komputasi TreeSHAP

```
[ Vector Fitur Masukan ]
 (Suhu Tanah: 34.1°C, Kelembaban: 22.4%, pH: 7.83, Suhu Udara: 33.5°C)
            │
            ▼
[ shap.TreeExplainer(model_lgbm) ]
            │ (Waktu komputasi < 8 ms)
            ▼
[ Raw SHAP Values (Log-odds / Probabilitas) ]
 • soil_temp_c : +0.385 (Menaikkan risiko penguapan sebesar 38.5%)
 • moisture_pct: +0.260 (Menaikkan risiko sebesar 26.0%)
 • ph          : +0.097 (Menaikkan risiko sebesar 9.7%)
 • wind_speed  : -0.012 (Menurunkan risiko sedikit karena angin tenang)
            │
            ▼
[ Rule-Based Natural Language Translator ]
            │
            ▼
[ Narasi Penjelasan untuk Petani di Dashboard & WhatsApp ]
```

---

## 3. Kamus Pemetaan Narasi Penjelasan (Human-Readable Mapping)

Setiap fitur memiliki aturan konversi otomatis berdasarkan tanda (*sign*) dan besaran nilai SHAP:

| Fitur | Kondisi Nilai | Arah Dampak | Label Tampilan UI / Pesan WhatsApp |
|---|---|---|---|
| `soil_temp_c` | Nilai > 30.0°C | Positif (Naik) | *"Suhu tanah sangat terik ({val}°C) memicu penguraian cepat enzim urease"* |
| `soil_temp_c` | Nilai < 27.0°C | Negatif (Turun) | *"Suhu tanah sejuk ({val}°C) memperlambat penguapan gas"* |
| `moisture_pct`| Nilai < 25.0% | Positif (Naik) | *"Tanah terlalu kering ({val}%), butiran Urea tidak dapat larut ke perakaran"* |
| `moisture_pct`| Nilai 35% – 50%| Negatif (Turun) | *"Kelembaban tanah ideal ({val}%), pupuk langsung larut aman ke perakaran"* |
| `ph` | Nilai > 7.40 | Positif (Naik) | *"Reaksi tanah alkalin Solokuro (pH {val}) mempercepat pelepasan gas amonia bebas"* |
| `wind_speed_ms`| Nilai > 3.5 m/s | Positif (Naik) | *"Hembusan angin kencang ({val} m/s) menyapu lapisan gas di atas tanah"* |
| `rain_forecast`| Nilai > 5.0 mm | Negatif (Turun) | *"Prakiraan hujan dalam waktu dekat akan membantu melarutkan pupuk ke dalam tanah"* |

---

## 4. Struktur Data Output SHAP (`shap_values`)

Struktur JSON ini disematkan di dalam respons inferensi sesuai [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2.2:

```json
[
  {
    "feature": "soil_temp_c",
    "measured_value": 34.1,
    "unit": "°C",
    "impact_pct": 38.5,
    "direction": "increases_risk",
    "explanation": "Suhu tanah sangat terik (34.1°C) memicu penguraian cepat enzim urease"
  },
  {
    "feature": "moisture_pct",
    "measured_value": 22.4,
    "unit": "%",
    "impact_pct": 26.0,
    "direction": "increases_risk",
    "explanation": "Tanah terlalu kering (22.4%), butiran Urea tidak dapat larut ke perakaran"
  },
  {
    "feature": "ph",
    "measured_value": 7.83,
    "unit": "",
    "impact_pct": 9.7,
    "direction": "increases_risk",
    "explanation": "Tanah berkapur/basa (pH 7.83) mempercepat pelepasan gas amonia bebas"
  }
]
```
