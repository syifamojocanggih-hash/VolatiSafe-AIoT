# SKENARIO_BENCHTOP_TKT4.md — Protokol Uji Terpadu Meja (24 Jam Menuju TKT 4)

> **VOLATISAFE AIoT — VERIFIKASI FUNGSI KRITIS BENCHTOP TESTBED**  
> **Status Dokumen:** Rancangan Eksekusi Uji 1 Hari  
> **Cabang Aktif:** `Development`  
> **Catatan Dependensi:** Disusun dengan memitigasi status cabang `iot` dan `digittal-twin` yang **belum di-merge** ke `Development`.

---

## 1. Konteks & Strategi Eksekusi Tanpa Merge

Saat ini:
* Branch `iot` (Hafiiz) belum di-merge ke `Development`. File firmware fisik berada di branch `iot`.
* Branch `digittal-twin` (Andharu) belum di-merge ke `Development`. Modul FAO-56 (`water_balance.py`) belum selesai.
* Branch `ai` **sudah** di-merge ke `Development` (commit `b8123c7`). Modul `ai_engine/service.py`, `ai_engine/window_forecaster.py`, dan `models/avri_model.txt` **sudah siap jalan di branch ini**.

### Solusi Isolasi:
Uji TKT 4 meja ini **tidak membutuhkan merge penuh**. Uji ini hanya memerlukan:
1. **Hardware fisik:** 1 ESP32 + Sensor Kelembapan Kapasitif + Sensor Suhu DS18B20 + Kabel USB data (tanpa LoRa, tanpa baterai, tanpa sensor pH fisik).
2. **Firmware:** Kode baca serial ringkas (~50 baris) diunggah via Arduino IDE / PlatformIO ke ESP32.
3. **Bridge Serial:** Script Python pembaca serial di laptop yang memetakan input sensor fisik ke DTO `PredictRiskRequestDTO` milik `ai_engine/service.py`.
4. **Fallback pH & DT:** pH dikunci pada konstanta Solokuro **$7.62$** (Agroteknika 2024). Modul DT digantikan sementara oleh input baseline tanah terkalibrasi yang sudah ada di DTO inferensi AI.

---

## 2. Arsitektur Uji Meja (Hardware-in-the-Loop)

```
[ Pot Tanah Uji ]
  ├── Sensor Kelembapan Kapasitif (GPIO 34)
  └── Sensor Suhu DS18B20 (GPIO 4 + Resistor 4.7kΩ)
            │
      [ ESP32 Fisik ]
            │ (Kabel USB Data ke Laptop — Baud 115200)
    [ Laptop: serial_hardware_bridge.py ]
            │ (Memformat JSON -> PredictRiskRequestDTO)
      [ ai_engine/service.py ] 
            │ (Arrhenius + LightGBM avri_model.txt)
            ▼
[ Output: Skor AVRI 0-100%, Kategori Risiko, Jendela Aman ]
```

---

## 3. Spesifikasi Wiring Hardware (Komponen Struk Pembelian)

Gunakan komponen yang sudah dibeli dari Akhishop (Rp172.900):

| Komponen | Pin Sensor | Pin ESP32 | Keterangan Wajib |
|---|---|---|---|
| **Capacitive Moisture v1.2** | VCC | 3.3V | Catu daya regulator 3.3V |
| | GND | GND | Ground bersama |
| | AOUT / SIG | **GPIO 34** | Wajib ADC1 (GPIO 34 input-only, aman dari interferensi) |
| **DS18B20 Waterproof** | VCC (Merah) | 3.3V | Catu daya 3.3V |
| | GND (Hitam) | GND | Ground bersama |
| | DATA (Kuning/Putih) | **GPIO 4** | Digital 1-Wire |
| **Resistor Pull-up** | - | Antara VCC & DATA | **4.7 kΩ** (atau gunakan internal pull-up jika kabel pendek) |
| **Sensor pH** | - | - | **TIDAK DIPASANG FISIK**. Nilai pH dikunci software ke **7.62** |
| **Modul LoRa & Baterai** | - | - | **TIDAK DIPASANG**. Daya via USB laptop, data via Serial |

---

## 4. Protokol 3 Titik Pengujian Meja (Uji Akselerasi 1 Hari)

Gunakan 1 pot tanah pekarangan/kebun biasa untuk membuktikan responsivitas sistem:

### Titik Uji 1: Kondisi Basah / Pasca Hujan (Target: AMAN / HIJAU)
* **Perlakuan:** Siram pot tanah dengan air hingga jenuh air (~1-2 gelas). Tancapkan sensor kelembapan dan DS18B20.
* **Nilai Input Terukur:**
  * Kelembapan: $\ge 35\%$ VWC
  * Suhu Tanah: Sejuk ($24^\circ\text{C} - 26^\circ\text{C}$)
  * pH: $7.62$ (Software locked)
* **Ekspektasi Output AI (`ai_engine/service.py`):**
  * `avri_score`: $\le 25.0\%$
  * `risk_category`: `aman` (`APPLY_NOW`)
  * `safe_window_open`: `True`
* **Bukti Diambil:**
  * Foto 1: Probe tertancap di tanah basah pot.
  * Screenshot 1: Terminal bridge menampilkan JSON output `risk_category: aman`.

### Titik Uji 2: Kondisi Kering & Panas (Target: BAHAYA / MERAH)
* **Perlakuan:** Cabut sensor kelembapan ke tanah kering/udara ($< 20\%$). Hangatkan probe DS18B20 (genggam tangan rapat-rapat atau jemur hingga suhu terbaca $> 32^\circ\text{C}$).
* **Nilai Input Terukur:**
  * Kelembapan: $\le 18\%$ VWC
  * Suhu Tanah: Panas ($> 32^\circ\text{C}$)
  * pH: $7.62$ (Software locked)
* **Ekspektasi Output AI (`ai_engine/service.py`):**
  * `avri_score`: $\ge 70.0\%$
  * `risk_category`: `kritis` atau `bahaya` (`PROHIBIT_APPLICATION` / `DELAY_FERTILIZATION`)
  * `safe_window_open`: `False`
* **Bukti Diambil:**
  * Foto 2: Probe kondisi panas/kering.
  * Screenshot 2: Terminal bridge menampilkan status `bahaya` dengan breakdown TreeSHAP suhu tinggi.

### Titik Uji 3: Transisi Dinamis / Respon Real-Time
* **Perlakuan:** Mulai dari Titik 2 (Merah/Bahaya). Kucurkan air perlahan ke pot tanah hingga sensor mendeteksi kelembapan naik secara kontinyu.
* **Ekspektasi Sistem:**
  * Dalam 1-2 siklus pembacaan serial, nilai AVRI turun dari $>70\%$ ke $<30\%$.
  * Kategori risiko berubah dinamis di layar dari **Merah $\rightarrow$ Kuning $\rightarrow$ Hijau**.
* **Bukti Diambil:**
  * Video pendek 15–30 detik transisi status live di layar laptop saat tanah disiram air.

---

## 5. Implementasi Script Bridge Serial (`tools/serial_hardware_bridge.py`)

Script ini berjalan di laptop dan menghubungkan port COM/USB mikrokontroler dengan AI Engine yang sudah ada di branch `Development`:

```python
"""
Serial-to-AI Engine Bridge untuk Uji Meja TKT 4
Membaca JSON dari ESP32 via USB Serial, memanggil ai_engine.service,
dan menampilkan hasil inferensi AVRI secara real-time.
"""
import sys
import json
import time
from pathlib import Path

# Tambahkan root repo ke sys.path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from ai_engine.service import AIEngineService, PredictRiskRequestDTO, SoilStateDTO, WeatherForecast12hDTO

PH_BASELINE_SOLOKURO = 7.62  # Hasil uji lab Agroteknika 2024

def run_benchtop_inference(moisture_pct: float, soil_temp_c: float, ph: float = PH_BASELINE_SOLOKURO):
    service = AIEngineService(model_path="models/avri_model.txt")
    
    request = PredictRiskRequestDTO(
        field_id="BENCHTOP-POT-01",
        soil_state=SoilStateDTO(
            moisture_pct=moisture_pct,
            soil_temp_c=soil_temp_c,
            ph=ph
        ),
        weather_forecast_12h=WeatherForecast12hDTO(
            air_temp_c=soil_temp_c - 1.5,
            relative_humidity_pct=65.0,
            solar_radiation_mj=2.5,
            wind_speed_ms=1.2,
            rain_forecast_mm=0.0
        )
    )
    
    result = service.predict_avri(request)
    print("=" * 60)
    print(f"INPUT SENSOR FISIK  : Kelembapan = {moisture_pct:.1f}%, Suhu = {soil_temp_c:.1f}°C, pH = {ph:.2f}")
    print(f"OUTPUT AI PREDIKSI  : AVRI = {result.avri_score:.1f}% [{result.risk_category.upper()}]")
    print(f"JENDELA AMAN        : {'TERBUKA (Boleh Pupuk)' if result.safe_window_open else 'TERTUTUP (Tunda)'}")
    print(f"REKOMENDASI         : {result.prescription.title} - {result.prescription.immediate_guidance}")
    print("=" * 60)
    return result

if __name__ == "__main__":
    # Contoh uji coba langsung (mock/serial sim)
    print("Menjalankan Simulasi Uji 3 Titik Meja...")
    print("\n[TITIK 1: BASAH]")
    run_benchtop_inference(moisture_pct=38.0, soil_temp_c=25.5)
    
    print("\n[TITIK 2: KERING & PANAS]")
    run_benchtop_inference(moisture_pct=17.5, soil_temp_c=34.0)
```

---

## 6. Pemetaan Bukti ke Lampiran Proposal

Setelah uji 3 titik selesai dieksekusi:

| Hasil Uji Meja | Masuk ke Dokumen Lampiran | Penempatan / Nomor Bukti |
|---|---|---|
| **Foto Rangkaian Breadboard & Sensor** | `Lampiran_4_Rancangan_Prototipe_Hardware_dan_Wokwi.docx` | Gambar 1 (Gantikan placeholder foto) |
| **Foto Uji Pot Tanah & Transisi** | `Lampiran_5_Laporan_Hasil_Pengujian_Laboratorium_dan_Simulasi_IoT_TKT3.docx` | Gambar 3 (Gantikan placeholder pengujian meja) |
| **Log Terminal Hasil AVRI & Latensi** | `Lampiran_5_Laporan_Hasil_Pengujian_Laboratorium_dan_Simulasi_IoT_TKT3.docx` | Tabel 3 & Nilai token `[x]` |
| **Klaim TKT 4 Validated in Lab** | Naskah Utama `Proposal_VolatiSafe.docx` | Paragraf 54 & 67 (Perkiraan TKT) |

---

## 7. Rencana Penyatuan (Merge) Pasca-Uji

Setelah uji meja berhasil membuktikan TKT 4:
1. **Branch `iot`:** Hafiiz commit firmware final, lalu merge ke `Development` sesuai `docs/universal/INTEGRATION_RUNBOOK.md` Tahap 1.
2. **Branch `digittal-twin`:** Andharu menyelesaikan `water_balance.py`, lalu merge ke `Development` Tahap 2.
3. Rantai integrasi penuh (Hardware $\rightarrow$ DT $\rightarrow$ AI $\rightarrow$ Fullstack) siap dirilis ke `main`.
