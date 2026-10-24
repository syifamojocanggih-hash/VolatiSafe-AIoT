# MOCK_PREDICTOR.md — Mock Predictor untuk Pengujian Mandiri Backend

---

## 1. Peran Mock Predictor dalam Isolasi Subsistem

Untuk memastikan tim Backend AI dan Frontend AI dapat menguji seluruh alur integrasi tanpa menunggu file model machine learning selesai dilatih, AI Agent menyediakan script **Mock Predictor Standalone**.

### Karakteristik Mock Predictor:
- **Zero Heavy Dependency:** Hanya menggunakan Python standar (tanpa perlu install `lightgbm`, `shap`, atau `scikit-learn`).
- **Deterministik & Realistis:** Menghasilkan skor AVRI yang masuk akal dan konsisten secara fisika (bukan angka acak murni).
- **100% Sesuai Kontrak:** Menghasilkan struktur dictionary yang mematuhi `PredictRiskResponseDTO` di [`docs/universal/INTERFACES.md`](file:///c:/Users/ASUS/Documents/code/VolatiSafe-AIoT/docs/universal/INTERFACES.md) §2.2.

---

## 2. Implementasi Referensi Python (`mock_predictor.py`)

Backend dapat mengimpor kelas ini saat variabel lingkungan `MOCK_AI_PREDICTOR=true`:

```python
# File: ai_engine/mock_predictor.py
from datetime import datetime, timezone
import math

class MockAVRIPredictor:
    """
    Mock Predictor independen untuk pengujian backend tanpa ketergantungan ML library.
    """
    
    @staticmethod
    def predict(soil_temp_c: float, moisture_pct: float, ph: float, rain_forecast_mm: float = 0.0) -> dict:
        # 1. Aproksimasi fisika deterministik
        # Suhu di atas 28C menaikkan risiko
        temp_factor = max(0.0, (soil_temp_c - 20.0) * 2.5)
        
        # Kelembaban di bawah 35% menaikkan risiko penguapan
        moisture_factor = max(0.0, (40.0 - moisture_pct) * 1.8)
        
        # pH di atas 7.0 menaikkan risiko
        ph_factor = max(0.0, (ph - 6.5) * 12.0)
        
        # Hujan meredam risiko
        rain_discount = min(40.0, rain_forecast_mm * 4.0)
        
        # Hitung skor komposit
        raw_score = 10.0 + temp_factor + moisture_factor + ph_factor - rain_discount
        avri_score = round(max(5.0, min(95.0, raw_score)), 1)
        
        # Tentukan kategori
        if avri_score <= 30.0:
            category = "aman"
            is_safe = True
            action = "APPLY_NOW"
            title = "WAKTU TEPAT MENABUR UREA"
            guidance = "Kondisi tanah optimal. Segera lakukan penaburan pupuk."
        elif avri_score <= 60.0:
            category = "waspada"
            is_safe = False
            action = "IRRIGATE_FIRST"
            title = "WASPADA PENABURAN"
            guidance = "Siram tanah terlebih dahulu sebelum menabur, atau tunggu sore hari."
        elif avri_score <= 80.0:
            category = "kritis"
            is_safe = False
            action = "DELAY_FERTILIZATION"
            title = "TUNDA PENABURAN UREA"
            guidance = "Potensi penguapan tinggi. Tunda aplikasi hingga tanah lembap."
        else:
            category = "bahaya"
            is_safe = False
            action = "STOP_APPLICATION"
            title = "DILARANG MENABUR UREA"
            guidance = "Tanah sangat kering dan panas. Pemupukan akan terbuang percuma."

        return {
            "avri_score": avri_score,
            "risk_category": category,
            "safe_window_open": is_safe,
            "next_safe_window": {
                "start_time": "2026-10-25T06:00:00Z",
                "end_time": "2026-10-25T09:00:00Z",
                "projected_avri": 18.5,
                "confidence_pct": 85
            },
            "prescription": {
                "action_id": action,
                "title": title,
                "summary": f"Skor AVRI {avri_score}%. Risiko penguapan {category}.",
                "immediate_guidance": guidance,
                "shap_explanations": [
                    {
                        "feature": "soil_temp_c",
                        "label": f"Suhu Tanah ({soil_temp_c}°C)",
                        "impact_pct": round(temp_factor, 1),
                        "direction": "increases_risk" if temp_factor > 10 else "neutral"
                    },
                    {
                        "feature": "moisture_pct",
                        "label": f"Kelembaban ({moisture_pct}%)",
                        "impact_pct": round(moisture_factor, 1),
                        "direction": "increases_risk" if moisture_factor > 10 else "neutral"
                    }
                ]
            },
            "model_meta": {
                "version": "mock-piml-v1.0",
                "inferred_at": datetime.now(timezone.utc).isoformat()
            }
        }
```
