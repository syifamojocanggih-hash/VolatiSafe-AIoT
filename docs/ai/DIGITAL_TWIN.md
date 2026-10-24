# DIGITAL_TWIN.md — Spesifikasi Agro-Climatic Digital Twin

---

## 1. Definisi & Peran Sistem

Agro-Climatic Digital Twin pada VolatiSafe AIoT **bukan visualisasi 3D grafis**. Ini adalah **model state biofisik virtual berbasis deret waktu** yang mereplikasi dinamika kelembaban, suhu, dan pH tanah secara kontinu pada setiap petak sawah/ladang jagung.

### Tiga Fungsi Utama:
1. **Imputasi Celah Data (*Failover Engine*):** Saat node sensor mengalami *blank spot* atau kehabisan daya baterai, model biofisik mengambil alih untuk memprediksi perubahan kelembaban tanah berdasarkan neraca air FAO-56.
2. **Proyeksi Dinamis 72 Jam (*Forecast Window*):** Mengombinasikan state tanah saat ini dengan prakiraan cuaca BMKG untuk memperkirakan jendela waktu aman pemupukan.
3. **Simulasi Skenario Pengujian (*What-If Engine*):** Menjalankan kalkulasi simulasi interaktif untuk pengujian dewan juri tanpa mengubah data riil database.

---

## 2. Vektor State Digital Twin per Petak

Setiap petak jagung direpresentasikan sebagai objek state yang dimutakhirkan setiap interval 15 menit:

| Variabel State | Simbol | Satuan | Sumber Data | Model Pembaruan / Transisi |
|---|---|---|---|---|
| **Kelembaban Tanah** | $\theta$ | % VWC | Sensor Kapasitif (Live) / FAO-56 (Imputasi) | Neraca air perakaran FAO-56 |
| **Suhu Permukaan Tanah** | $T_{soil}$ | °C | Sensor DS18B20 (Live) / Difusi (Imputasi) | Model difusi termal teredam (*damped*) |
| **Derajat Keasaman** | $pH$ | — | Sensor Analog pH (Terkoreksi) | Dinamika pengasaman pemupukan lambat |
| **Kelembaban Udara** | $RH$ | % | API BMKG / Cuaca Historis | Ingestion berkala |
| **Suhu Udara Aktual** | $T_{air}$ | °C | API BMKG / Stasiun Lampung | Ingestion berkala |
| **Radiasi Surya** | $R_s$ | $MJ/m^2/\text{hari}$ | Model Radiasi Hargreaves / BMKG | Estimasi dari beda suhu harian |
| **Prakiraan Curah Hujan** | $P$ | mm / 3 jam | API Prakiraan BMKG | Input langsung neraca air |
| **Kecepatan Angin (2m)** | $u_2$ | m/s | API Cuaca Stasiun BMKG | Input evapotranspirasi |
| **Hari Setelah Tanam** | $DAT$ | hari | Dynamic DAT Tracker (Input Petani) | Increment harian otomatis |

---

## 3. Persamaan Transisi Biofisik Tanah

### 3.1 Neraca Air Tanah Berbasis Standar FAO-56
Evapotranspirasi acuan ($ET_0$) dihitung menggunakan persamaan standar internasional Penman-Monteith:

$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \left( \frac{900}{T_{air} + 273} \right) u_2 (e_s - e_a)}{\Delta + \gamma (1 + 0.34 u_2)}$$

Kebutuhan air aktual tanaman jagung ($ET_c$):
$$ET_c = K_c \cdot ET_0$$
*Koefisien tanaman $K_c$ disesuaikan dengan fase fenologi jagung (Fase V3: $K_c \approx 0.4$, Fase V8: $K_c \approx 0.8$, Fase Pembungaan: $K_c \approx 1.15$).*

Perubahan kelembaban tanah ($\Delta \theta$):
$$\Delta \theta = \frac{P_{effective} - ET_c - Runoff}{Root\_depth}$$
$$\theta(t+1) = \text{clamp}\left(\theta(t) + \Delta \theta, \, \theta_{wp}, \, \theta_{fc}\right)$$
*Keterangan: $\theta_{wp}$ adalah titik layu permanen (~12% VWC) dan $\theta_{fc}$ adalah kapasitas lapang (~42% VWC).*

### 3.2 Difusi Termal Tanah Teredam (*Damped Thermal Diffusion*)
Suhu tanah di kedalaman 5 cm merespon perubahan suhu udara dengan efek redaman inersia termal:

$$T_{soil}(t+1) = T_{soil}(t) + \alpha \cdot \left( T_{air}(t) - T_{soil}(t) \right)$$
- $\alpha = 0.12$ (tanah basah / lembap — inersia panas tinggi, suhu stabil).
- $\alpha = 0.28$ (tanah kering — inersia panas rendah, suhu cepat melonjak saat terik).

---

## 4. Empat Mode Operasi Digital Twin

| Mode Operasi | Syarat / Kondisi | Perilaku Sistem |
|---|---|---|
| **Mode Live** | Sensor mengirimkan telemetri normal (< 30 menit) | Digital twin mengadopsi data sensor aktual secara langsung. |
| **Mode Imputasi (Failover)** | Sensor offline / putus antara 30 menit hingga 12 jam | Model transisi FAO-56 memprediksi degradasi kelembaban tanah; data ditandai `is_predicted = true`. |
| **Mode Forecast** | Selalu aktif di latar belakang | Menghitung proyeksi 72 jam ke depan untuk bar status rekomendasi pemupukan. |
| **Mode What-If** | Dipicu aksi pengguna / juri di UI | Mengevaluasi skor AVRI instan pada sandbox tanpa mengubah state riil database. |

---

## 5. Audit-Proof Data Provenance

Untuk menghindari diskualifikasi dewan juri akibat "simulator palsu acak", prototipe software fase TKT 3 digerakkan oleh **dataset historis riil stasiun cuaca**:
- **Stasiun Sumber:** Stasiun Meteorologi Radin Inten II (Lampung) & Stasiun BMKG Tuban/Lamongan.
- **Rentang Data:** Deret waktu 1 tahun penuh (resolusi per jam).
- **Integritas:** Riwayat ingest disimpan di tabel `data_provenance` lengkap dengan checksum SHA-256.
