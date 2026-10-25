# TASK_GUIDE.md — Agro-Climatic Digital Twin (Andharu)

> **PENANGGUNG JAWAB:** Andharu Raffi (Andharu)  
> **ROLE:** *Digital Twin Engineer*  
> **AREA KERJA (R/W):** `digital_twin/`, `simulations/data_replay/`, `docs/digital_twin/`  
> **CABANG GIT:** `digittal-twin`
> **KONTRAK DATA:** [`docs/universal/INTERFACES.md`](../universal/INTERFACES.md) §2 (FieldStateDTO)  

---

## 🎯 Target Utama Domain Digital Twin
Membangun mesin biofisika tanah virtual kontinu yang mampu memutakhirkan state tanah setiap interval 15 menit, mengestimasi kelembaban dan suhu lapisan perakaran jagung menggunakan neraca air FAO-56 Penman-Monteith, menjalankan failover imputasi otomatis saat sensor fisik/Wokwi terputus, serta memproyeksikan kurva mikroklimat 72 jam ke depan berbasis data prakiraan BMKG.

---

## 📋 Daftar Tugas & Tahapan Implementasi

### TAHAP 1: Replay Data Cuaca Historis BMKG

#### 🟢 DT-1.1: Streaming Replay Ingestion Controller
- **Deskripsi:** Menyiapkan skrip pembaca dataset cuaca riil dari BMKG Stasiun Meteorologi Radin Inten II Lampung (interval 1 jam: radiasi surya, suhu udara, kelembaban udara, kecepatan angin, curah hujan) untuk memutar ulang kondisi nyata 24 jam.
- **Target File:** `simulations/data_replay/bmkg_replay.py`
- **Acuan Spesifikasi:** [`docs/digital_twin/WEATHER_REPLAY.md`](WEATHER_REPLAY.md)
- **Checklist:**
  - [ ] Membaca CSV cuaca historis tanpa error.
  - [ ] Menyediakan generator streaming yang memancarkan data cuaca per interval simulasi (tiap 15 menit).
  - [ ] Mencatat checksum SHA-256 berkas CSV ke tabel `data_provenance` untuk audit juri.

---

### TAHAP 2: Implementasi Neraca Air Zona Perakaran (FAO-56)

#### 🟢 DT-1.2: Engine Evapotranspirasi Penman-Monteith & Koefisien Jagung
- **Deskripsi:** Mengimplementasikan modul perhitungan evapotranspirasi acuan harian ($ET_0$) dan evapotranspirasi aktual tanaman jagung ($ET_c$) berbasis umur tanaman ($DAT$).
- **Target File:** `digital_twin/water_balance.py`
- **Acuan Spesifikasi:** [`docs/digital_twin/FAO56_WATER_BALANCE.md`](FAO56_WATER_BALANCE.md)
- **Logika Perhitungan:**
  - Hitung defisit tekanan uap jenuh ($e_s - e_a$) dan kemiringan kurva $\Delta$.
  - Hitung $ET_0$ Penman-Monteith lengkap dengan faktor aerodinamika kecepatan angin $u_2$.
  - Terapkan koefisien dinamis $K_c(DAT)$: VE-V2 ($0.40$), V3-V8 ($0.80$), Pembungaan VT-R1 ($1.15$), Pengisian Biji ($1.05$), Pemasakan ($0.60$).
  - Perbarui kadar air tanah perakaran:
    $$\theta(t+1) = \text{clamp}\Big(\theta(t) + \frac{P_{eff} - ET_c}{Z_r \cdot 1000}, \; \theta_{wp}, \; \theta_{fc}\Big)$$
- **Checklist:**
  - [ ] Kadar air tanah terbukti tidak pernah di bawah titik layu ($\theta_{wp} \approx 12\%$) atau di atas kapasitas lapang ($\theta_{fc} \approx 42\%$).
  - [ ] Fungsi callable mengembalikan `etc_mm` dan `updated_theta_pct`.

---

### TAHAP 3: Model Difusi Termal Tanah Teredam

#### 🟢 DT-1.3: Model Perambatan Panas Tanah (Inersia Termal)
- **Deskripsi:** Memodelkan perambatan panas dari udara ke lapisan perakaran tanah (kedalaman 5–10 cm) dengan redaman inersia panas berbasis kadar air tanah.
- **Target File:** `digital_twin/thermal_diffusion.py`
- **Acuan Spesifikasi:** [`docs/digital_twin/THERMAL_DIFFUSION.md`](THERMAL_DIFFUSION.md)
- **Logika Perhitungan:**
  $$T_{soil}(t+1) = T_{soil}(t) + \alpha(\theta) \cdot \Big(T_{air}(t) - T_{soil}(t)\Big)$$
  - $\alpha$ tanah kering = $0.28$ (cepat panas saat terik).
  - $\alpha$ tanah basah = $0.10$ (lambat panas karena panas jenis air tinggi).
- **Checklist:**
  - [ ] Puncak suhu tanah hasil estimasi mengalami fase tunda (*phase lag*) minimal 60–90 menit dibanding puncak suhu udara siang hari.

---

### TAHAP 4: Mesin Failover & Imputasi Celah Data

#### 🟢 DT-1.4: State-Space Imputation Failover Engine
- **Deskripsi:** Menangani kondisi darurat jika node sensor terputus (> 30 menit). Digital Twin secara otomatis memproyeksikan penurunan kelembaban dan kenaikan suhu secara matematis agar sistem backend dan AI tetap mendapatkan suplai fitur.
- **Target File:** `digital_twin/state_imputer.py`
- **Acuan Spesifikasi:** [`docs/digital_twin/FAILOVER_IMPUTATION.md`](FAILOVER_IMPUTATION.md)
- **Checklist:**
  - [ ] Menghasilkan objek `FieldStateDTO` lengkap dengan flag `is_predicted: true`.
  - [ ] Menurunkan nilai `confidence_score` bertahap (1.0 saat live $\rightarrow$ 0.90 setelah 3 jam $\rightarrow$ 0.70 setelah 12 jam).
  - [ ] Akurasi estimasi saat sensor putus 6 jam memiliki Mean Absolute Error (MAE) $\le 3.5\%$ VWC terhadap ground truth.

---

### TAHAP 5: Proyeksi 72 Jam & Sandbox 

#### 🟢 DT-1.5: 72-Hour Forecaster (Jendela Aman)
- **Deskripsi:** Membangun generator kurva 72 jam untuk penentuan jendela aman pemupukan.
- **Target File:** `digital_twin/forecaster.py`
- **Checklist:**
  - [ ] Menerima array 72 jam ramalan cuaca BMKG dan mengembalikan array 72 jam proyeksi $\theta$ dan $T_{soil}$.
  
---

## 🚫 Zona Terlarang Andharu (DILARANG KERAS)
1. ❌ DILARANG mengubah algoritma machine learning LightGBM atau merombak formula AVRI di `ai_engine/`.
2. ❌ DILARANG membuka koneksi langsung ke hardware ESP32 atau menulis kode firmware.
3. ❌ DILARANG menulis komponen UI dashboard Next.js atau query SQL backend langsung.
4. ❌ DILARANG mengubah struktur atribut `FieldStateDTO` di luar kesepakatan `docs/universal/INTERFACES.md` §2.
