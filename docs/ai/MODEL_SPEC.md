# MODEL_SPEC.md — Spesifikasi Physics-Informed ML (PIML) & AVRI

---

## 1. Definisi Ammonia Volatilization Risk Index (AVRI)

**AVRI (Ammonia Volatilization Risk Index)** adalah indeks probabilitas kontinu bernilai **0–100%** yang merepresentasikan estimasi proporsi nitrogen yang berisiko hilang menguap ke atmosfer dalam wujud gas amonia ($NH_3$) dalam rentang waktu 12 jam setelah pemupukan Urea diterapkan.

---

## 2. Formulasi Physics-Informed Machine Learning (PIML)

Alih-alih menggunakan *black-box fitting* murni yang rentan menghasilkan prediksi tidak masuk akal pada data ekstrapolasi, VolatiSafe AIoT menerapkan pendekatan hibrida **Physics-Informed ML**:

```
                       ┌──────────────────────────────────────────────┐
                       │           LAPISAN FISIKA BIOKIMIA            │
                       │    Kinetika Urease Arrhenius (Suhu)          │
                       │  + Pembatas Kelembaban Michaelis-Menten      │
                       │  + Modifikasi Sigmoid pH Basa                │
                       └──────────────────────┬───────────────────────┘
                                              │ Nilai Teoretis Fisika
                                              ▼
Fitur Telemetri ──> [ Feature Pipeline ] ──> (+) ──> [ Clip 0–100% ] ──> Skor AVRI
                                              ▲
                                              │ Nilai Deviasi Residual
                       ┌──────────────────────┴───────────────────────┐
                       │           LAPISAN MACHINE LEARNING           │
                       │   LightGBM Regressor (Quantile Loss)         │
                       │   Memprediksi interaksi mikrokompleks        │
                       │   (radiasi matahari, selisih suhu, angin)    │
                       └──────────────────────────────────────────────┘
```

### 2.1 Lapisan Fisika 1: Kinetika Suhu Enzim Urease (Arrhenius)
Laju penguraian urea oleh enzim urease tanah meningkat secara eksponensial terhadap suhu tanah permukaan sesuai persamaan Arrhenius:

$$k_{urease}(T_{soil}) = A \cdot \exp\left( -\frac{E_a}{R \cdot (T_{soil} + 273.15)} \right)$$
- $A = 3.2 \times 10^8 \text{ per jam}$ (faktor frekuensi tumbukan molekul).
- $E_a = 51.000 \text{ J/mol}$ (energi aktivasi enzim urease tanah tropis).
- $R = 8.314 \text{ J/(mol}\cdot\text{K)}$ (konstanta gas ideal universal).

### 2.2 Lapisan Fisika 2: Faktor Penekan Kelembaban (Michaelis-Menten)
Urea membutuhkan air tanah untuk larut dan terdifusi ke perakaran. Pada tanah kering, penguapan amonia meningkat tajam:
$$f_{moisture}(\theta) = \frac{\theta}{\theta + k_m}$$
*(dengan $k_m \approx 18\%$ VWC sebagai konstanta kejenuhan setengah).*

### 2.3 Lapisan Fisika 3: Faktor Akselerasi pH Tanah (Sigmoidal)
Pada tanah berkapur / alkalin ($pH > 7.0$), kesetimbangan ion $NH_4^+ \rightleftharpoons NH_3 \uparrow$ bergeser drastis ke arah pembentukan gas bebas:
$$f_{pH}(pH) = \frac{10^{pH - 7.0}}{1 + 10^{pH - 7.0}}$$

### 2.4 Formulasi Komposit Residual
$$\text{BasePhysics} = 100 \cdot \left[ k_{urease}(T_{soil}) \cdot (1 - f_{moisture}(\theta)) \cdot f_{pH}(pH) \right]$$
$$\text{AVRI} = \text{clip}\left( \text{BasePhysics} + \text{LightGBM}_{residual}(\vec{x}), \, 0.0, \, 100.0 \right)$$

---

## 3. Matriks Fitur Input & Bobot Kepentingan

| Fitur | Tipe | Sumber | Bobot / Importance | Deskripsi |
|---|---|---|---|---|
| `moisture_pct` | Float | Sensor Kapasitif | ★★★★★ (32%) | Penentu utama difusi urea ke pori tanah |
| `soil_temp_c` | Float | Probe DS18B20 | ★★★★★ (28%) | Pengendali eksponensial laju aktivitas urease |
| `ph` | Float | Probe pH Terkoreksi | ★★★★☆ (16%) | Penggeser kesetimbangan amonium ke gas amonia |
| `air_temp_c` | Float | API Cuaca BMKG | ★★★☆☆ (9%) | Pengaruh suhu ambien |
| `temp_delta` | Float | $T_{soil} - T_{air}$ | ★★★☆☆ (7%) | Indikator radiasi pemanasan permukaan tanah |
| `wind_speed_ms`| Float | API Cuaca BMKG | ★★☆☆☆ (5%) | Turbulensi penghilang lapisan batas gas di permukaan |
| `rain_forecast`| Float | Prakiraan BMKG 6j | ★★★☆☆ (3%) | Potensi pencucian urea masuk ke perakaran |

---

## 4. Klasifikasi Risiko & Preskripsi Aksi

| Skor AVRI | Kategori Risiko | Warna UI | Preskripsi Rekomendasi Lapangan |
|---|---|---|---|
| **0 – 30%** | **Aman** | 🟢 Hijau (`#16A34A`) | **Waktu tepat menabur Urea.** Lakukan sekarang. Potensi penguapan minimal, efisiensi penyerapan nitrogen optimal. |
| **31 – 60%** | **Waspada** | 🟡 Kuning (`#CA8A04`) | **Tabur hanya jika tanah disiram.** Berikan penyiraman ringan sebelum aplikasi, atau tunda hingga sore hari saat suhu turun. |
| **61 – 80%** | **Kritis** | 🟠 Oranye (`#EA580C`) | **TUNDA PENABURAN!** Risiko penguapan mencapai 60–80%. Tunggu jendela aman berikutnya atau hujan turun. |
| **81 – 100%** | **Bahaya** | 🔴 Merah (`#DC2626`) | **DILARANG MENABUR UREA!** Tanah sangat panas & kering. Kerugian pupuk hampir total (> 80%). Tunda 24–48 jam. |

---

## 5. Protokol Evaluasi & Retraining

1. **Skema Validasi:** Menggunakan `TimeSeriesSplit` (5-fold temporal window) dan *out-of-time holdout* (30 hari terakhir). Dilarang keras menggunakan *random k-fold split* karena data deret waktu memiliki autokorelasi serial.
2. **Metrik Keberhasilan:**
   - **MAE:** $\le 6.5\%$ terhadap nilai acuan uji emisi laboratorium.
   - **F1-Score Klasifikasi Kritis/Aman:** $\ge 0.85$.
3. **Penyimpanan Format Model:** Model disimpan dalam format `.txt` bawaan LightGBM (berukuran ~1.8 MB), memastikan *zero-dependency loading* tanpa ketergantungan pickle versi Python tertentu.
