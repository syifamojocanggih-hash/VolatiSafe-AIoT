# DOMAIN 2: AGRO-CLIMATIC DIGITAL TWIN — README.md

> **PENANGGUNG JAWAB TEKNIS:** Andharu Raffi (Andharu) — *Digital Twin Engineer*  
> **AREA AKSES PENUH (R/W):** `digital_twin/`, `simulations/data_replay/`, `docs/digital_twin/`  
> **CABANG GIT RESMI:** `digittal-twin`
> **KONTRAK DATA:** [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2 (FieldStateDTO)  

---

## 1. Filosofi & Mandat Ruang Lingkup Kerja

Andharu bertanggung jawab penuh atas seluruh kecerdasan pemodelan biofisika tanah virtual (*Agro-Climatic Digital Twin*):
- **Bukan Visualisasi 3D Grafis:** Model state-space biofisik kontinu berbasis deret waktu yang mereplikasi neraca air dan suhu perakaran secara matematis.
- **Failover Imputation Engine:** Mengisi celah data saat sensor fisik putus (*dropout*) agar sistem tidak pernah lumpuh.
- **72-Hour Temporal Forecaster:** Memproyeksikan kurva kelembaban dan suhu tanah ke depan berbasis data ramalan cuaca BMKG.
- **What-If Sandbox:** Menjalankan evaluasi simulasi interaktif untuk pengujian dewan juri.
- **Weather Data Replay:** Mengelola pemutaran ulang data historis riil stasiun cuaca BMKG Radin Inten II Lampung.

---

## 2. Peta Navigasi Dokumentasi Digital Twin

Dokumentasi domain Digital Twin dipecah menjadi berkas-berkas spesifikasi modular:

```
docs/digital_twin/
├── README.md                 <-- Dokumen ini (Master Index, Mandat & Batasan)
├── TASK_GUIDE.md             <-- Panduan langkah demi langkah implementasi tugas Andharu
├── FAO56_WATER_BALANCE.md    <-- Formulasi neraca air perakaran Penman-Monteith & Kc jagung
├── THERMAL_DIFFUSION.md      <-- Model perambatan panas tanah teredam (damped diffusion)
├── FAILOVER_IMPUTATION.md    <-- Mekanisme failover & imputasi saat sensor offline
└── WEATHER_REPLAY.md         <-- Spesifikasi dataset BMKG Lampung & tabel audit data_provenance
```

---

## 3. Matriks Batasan Wewenang (Boundary Matrix)

| Atribut | Ketetapan |
|---|---|
| **Area Boleh Ditulis (R/W)** | `digital_twin/`, `simulations/data_replay/`, `docs/digital_twin/` |
| **Output Resmi** | Vektor state tanah virtual kontinu (`FieldStateDTO`) yang disuplai ke backend database dan model AI Aris. |
| **Zona Terlarang (DILARANG KERAS)** | ❌ DILARANG mengutak-atik algoritma machine learning LightGBM atau formula AVRI di `ai_engine/`.<br>❌ DILARANG membuka koneksi hardware ESP32 atau menulis kode firmware.<br>❌ DILARANG menulis komponen UI dashboard Next.js atau query SQL backend langsung.<br>❌ DILARANG mengubah skema DTO di luar kesepakatan `INTERFACES.md` §2. |

---

## 4. Titik Kontak & Kontrak Antarmuka
Digital Twin berkomunikasi dengan subsistem lain menggunakan tipe data terstruktur (`dataclass` / Pydantic) sesuai kontrak:
- Input: Data telemetri sensor dari Gateway Backend (`SensorDataDTO`) dan data cuaca dari API/Replay (`WeatherStreamDTO`).
- Output: Status tanah virtual lengkap (`FieldStateDTO`) dengan atribut `is_predicted: bool`.
