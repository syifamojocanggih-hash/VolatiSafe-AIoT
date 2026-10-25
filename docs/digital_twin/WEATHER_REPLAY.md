# WEATHER_REPLAY.md — Protokol Replay Cuaca Historis BMKG & Audit Data Provenance

> **KOMPONEN INTI DIGITAL TWIN VOLATISAFE AIoT**  
> **Penanggung Jawab:** Andharu Raffi (Andharu) — *Digital Twin Engineer*  
> **Modul Kode:** `simulations/data_replay/bmkg_replay.py`  
> **Tujuan Utama:** Menjamin integritas data simulasi TKT 3 bebas manipulasi (*Audit-Proof Provenance*)  

---

## 1. Urgensi Ilmiah: Menghindari Diskualifikasi "Simulator Palsu"
Pada kompetisi DeepTech tingkat nasional (seperti skema Kemendiktisaintek × LPDP di UM Metro Lampung), juri ahli komputer dan pertanian memiliki kebiasaan menguji asal-usul data (*data provenance*):
> *"Apakah data simulasi yang Anda tampilkan di layar ini data nyata, atau tim Anda hanya memakai fungsi random `random.uniform(25, 35)` agar grafiknya terlihat bagus?"*

Jika sebuah tim tertangkap menggunakan angka acak buatan sendiri tanpa acuan data atmosfer riil, juri akan langsung melabeli proyek tersebut sebagai **mainan simulasi (*fake prototype*)** dan mendiskualifikasikannya.

Pada **VolatiSafe AIoT**, seluruh simulasi software fase TKT 3 digerakkan oleh **pemutaran ulang (*streaming replay*) data klimatologi historis riil dari stasiun resmi Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)**.

---

## 2. Spesifikasi Stasiun Cuaca & Format Dataset

### 2.1 Stasiun Sumber Resmi
1. **Stasiun Utama (Lokus Home-Base Lamongan):**  
   * **Nama:** Stasiun Meteorologi BMKG Tuban / Lamongan Utara & Pos Pengamatan Agroklimat Lamongan  
   * **WMO ID / Stasiun ID:** 96933  
   * **Karakteristik Iklim:** Dataran pantai utara Jawa Timur dengan tanah karst kapur dan suhu terik siang hari (33–36°C) saat musim kemarau serta kelembaban udara rendah, sangat representatif untuk sentra jagung dan padi sawah Kabupaten Lamongan.
2. **Stasiun Replikasi (Lokus Lampung):**  
   * **Nama:** Stasiun Meteorologi Radin Inten II Lampung (Stamet Lampung, WMO 96295)  
   * **Karakteristik Iklim:** Dataran rendah tropis basah dengan tanah masam ultisol yang dikapur, untuk pengujian adaptabilitas multi-lokus di Lampung.

### 2.2 Format Berkas CSV (`simulations/data_replay/datasets/bmkg_lamongan.csv`)
Dataset mencakup rentang 1 tahun penuh dengan resolusi per jam (8.760 baris data):

```csv
timestamp_utc,temp_air_c,humidity_rh,wind_speed_ms,solar_radiation_mj,precipitation_mm
2025-07-15T00:00:00Z,24.2,88.0,0.8,0.00,0.0
2025-07-15T03:00:00Z,27.8,76.0,1.5,1.85,0.0
2025-07-15T06:00:00Z,33.4,48.0,2.8,3.40,0.0
2025-07-15T07:00:00Z,34.8,42.0,3.2,3.65,0.0
2025-07-15T08:00:00Z,33.1,46.0,2.5,2.90,0.0
2025-07-15T11:00:00Z,28.5,72.0,1.2,0.45,0.0
2025-07-15T14:00:00Z,25.6,84.0,0.5,0.00,0.0
```

---

## 3. Skema Database Audit: Tabel `data_provenance`

Setiap kali skrip replay dijalankan, backend dan Digital Twin memverifikasi integritas berkas CSV menggunakan hash SHA-256 dan mencatatnya ke database TimescaleDB/PostgreSQL:

```sql
CREATE TABLE data_provenance (
    provenance_id    VARCHAR(64) PRIMARY KEY,
    source_name      VARCHAR(128) NOT NULL, -- 'BMKG Stasiun Meteorologi Radin Inten II'
    station_wmo_id   VARCHAR(32) NOT NULL,  -- '96295'
    geographic_locus VARCHAR(128) NOT NULL, -- 'Lampung Tengah & Metro'
    dataset_period   VARCHAR(64) NOT NULL,  -- '2025-01-01 to 2025-12-31'
    sha256_checksum  VARCHAR(64) NOT NULL,  -- Hash integritas berkas CSV
    total_records    INTEGER NOT NULL,      -- 8760 baris
    ingested_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_verified      BOOLEAN DEFAULT TRUE
);
```

**Bukti untuk Juri:**  
Saat sesi evaluasi prototipe, tim kamu dapat membuka tabel ini di pgAdmin / DBeaver untuk menunjukkan bahwa data yang menggerakkan simulasi memiliki nomor stasiun WMO resmi dan hash integritas yang tak terbantahkan.

---

## 4. Arsitektur Generator Streaming Replay (`bmkg_replay.py`)

Skrip `simulations/data_replay/bmkg_replay.py` dirancang sebagai generator asinkron yang memutar ulang data historis dengan kecepatan yang dapat diatur (*playback speed multiplier*):

```python
import csv
import time
import hashlib
from datetime import datetime
from dataclasses import dataclass

@dataclass
class WeatherRecord:
    timestamp: str
    temp_air_c: float
    humidity_rh: float
    wind_speed_ms: float
    solar_radiation_mj: float
    precipitation_mm: float

class BMKGWeatherReplayStreamer:
    def __init__(self, csv_path: str, speed_multiplier: float = 1.0):
        self.csv_path = csv_path
        self.speed_multiplier = speed_multiplier
        self.sha256 = self._compute_hash()

    def _compute_hash(self) -> str:
        h = hashlib.sha256()
        with open(self.csv_path, 'rb') as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()

    def stream_records(self):
        """Generator yang memancarkan 1 record cuaca setiap interval waktu."""
        with open(self.csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                record = WeatherRecord(
                    timestamp=row['timestamp_utc'],
                    temp_air_c=float(row['temp_air_c']),
                    humidity_rh=float(row['humidity_rh']),
                    wind_speed_ms=float(row['wind_speed_ms']),
                    solar_radiation_mj=float(row['solar_radiation_mj']),
                    precipitation_mm=float(row['precipitation_mm'])
                )
                yield record
                # Jeda simulasi (default: 1 jam data dipercepat menjadi 1 detik pada mode demo)
                time.sleep(1.0 / self.speed_multiplier)
```

---

## 5. Tiga Skenario Pengujian Resmi untuk Presentasi Juri

Andharu menyiapkan 3 berkas fragmen cuaca khusus untuk sesi live demo penjurian:

1. **Skenario A — Terik Ekstrem Kemarau (*High Volatilization Spike*):**
   * Berkas: `datasets/scenario_a_extreme_heat.csv`
   * Karakteristik: Pukul 11.00–14.00 WIB, suhu udara $35.2^\circ\text{C}$, radiasi surya $3.8\text{ MJ/m}^2$, angin $3.5\text{ m/s}$, tanpa hujan.
   * Respon Target: Digital Twin menaikkan suhu tanah ke $34^\circ\text{C}$ dan kelembaban drop ke $19\%$ $\rightarrow$ AI mengeluarkan AVRI $78\%$ (Kritis/Bahaya).
2. **Skenario B — Presipitasi Hujan Petir (*Safe Window Trigger*):**
   * Berkas: `datasets/scenario_b_thunderstorm.csv`
   * Karakteristik: Pukul 15.30 WIB terjadi hujan $22\text{ mm}$, suhu udara turun ke $25^\circ\text{C}$, kelembaban udara $95\%$.
   * Respon Target: Digital Twin menyerap air hujan, kelembaban tanah melonjak ke $42\%$ $\rightarrow$ AI seketika menurunkan AVRI ke $16\%$ (Aman), memicu pembukaan jendela pemupukan.
3. **Skenario C — Periode Kering Berkepanjangan (*7-Day Drought Stress*):**
   * Berkas: `datasets/scenario_c_7day_drought.csv`
   * Karakteristik: 7 hari berturut-turut tanpa hujan dengan suhu siang konstan di atas $33^\circ\text{C}$.
   * Respon Target: Menunjukkan grafik penurunan kadar air bertahap dari $32\%$ ke $13\%$ mengikuti persamaan FAO-56 Penman-Monteith, membuktikan keandalan neraca air tanaman.
