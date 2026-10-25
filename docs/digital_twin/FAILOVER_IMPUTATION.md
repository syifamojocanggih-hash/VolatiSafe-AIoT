# FAILOVER_IMPUTATION.md — Mesin Imputasi Celah Data Sensor Dropout

> **KOMPONEN INTI DIGITAL TWIN VOLATISAFE AIoT**  
> **Penanggung Jawab:** Andharu Raffi (Andharu) — *Digital Twin Engineer*  
> **Modul Kode:** `digital_twin/state_imputer.py`  
> **Target Metrik:** Mean Absolute Error (MAE) $\le 3.5\%$ VWC selama 6 jam pemutusan sensor  

---

## 1. Problem Lapangan: Ketidakteraturan Telemetri Pedesaan
Di hamparan kebun jagung nyata, telemetri IoT rentan mengalami gangguan:
1. *Radio Obstruction:* Daun kanopi jagung yang rimbun dan basah meredam sinyal radio LoRa (*path loss* sementara).
2. *Baterai Low:* Sinar matahari terhalang mendung tebal berhari-hari sehingga baterai 18650 drop sementara.
3. *Physical Disruption:* Probe sensor tertabrak cangkul petani atau hewan ternak.

Jika sistem IoT konvensional kehilangan sinyal, dashboard web akan menampilkan grafik kosong (*blank screen*) dan bot notifikasi mati total. Petani tidak tahu apakah hari itu aman memupuk atau tidak.

Pada **VolatiSafe AIoT**, arsitektur Digital Twin memecahkan masalah ini dengan **State-Space Failover Engine**.

---

## 2. Logika Deteksi Dropout & Ambang Timeout

Gateway Backend memantau selisih waktu paket telemetri terakhir (`last_seen`):

```
Waktu sejak transmisi terakhir:
0 menit ─────────── 30 menit ────────────────────── 12 jam ────────────── > 24 jam
   │                   │                               │                     │
[MODE LIVE]       [MODE IMPUTASI]              [WARNING CRITICAL]      [NODE OFFLINE]
Data sensor       Digital Twin ambil alih      Kirim alert teknis      Dashboard tandai
dipercaya 100%    Hitung FAO-56 & Difusi       ke tim/PPL              "Perlu Cek Fisik"
Confidence: 1.0   Confidence: 0.95 → 0.70      Confidence: 0.50        Confidence: 0.0
```

1. **Jendela Normal ($< 30\text{ menit}$):**
   * Mode: `Live`.
   * Data kadar air dan suhu tanah diambil langsung dari paket LoRa sensor.
   * `is_predicted = False`, `confidence_score = 1.0`.
2. **Jendela Imputasi ($30\text{ menit} - 12\text{ jam}$):**
   * Mode: `Failover Imputation`.
   * Digital Twin secara otonom memprediksi penurunan kelembaban tanah via neraca air FAO-56 dan perambatan panas difusi termal.
   * Data disimpan ke database dengan tanda: `is_predicted = True`.
   * Nilai keyakinan (*confidence score*) diturunkan secara bertahap.
3. **Jendela Kritis ($> 12\text{ jam}$):**
   * Sistem mengirimkan pesan WhatsApp ke teknisi/PPL: *"Node VS-A1-003 di Blok A tidak mengirim sinyal > 12 jam. Periksa baterai atau posisi probe."*

---

## 3. Algoritma Imputasi Biofisik Kontinu

Saat sensor hening, Digital Twin mengeksekusi perhitungan transisi state setiap 15 menit menggunakan persamaan berikut:

```python
# Pseudocode Alur Imputasi
def impute_step(last_state, weather_stream):
    # 1. Hitung kehilangan air via FAO-56 Penman-Monteith
    et0 = fao56.calculate_et0(weather_stream.air_temp_c, 
                              weather_stream.humidity_rh, 
                              weather_stream.wind_speed_ms, 
                              weather_stream.solar_radiation_mj)
    
    # 2. Estimasi kadar air tanah baru
    new_moisture, _ = fao56.update_soil_moisture(
        current_theta=last_state.moisture_pct,
        dat=last_state.dat,
        et0_daily=et0,
        rain_mm=weather_stream.rain_forecast_mm,
        interval_hours=0.25
    )
    
    # 3. Estimasi perambatan suhu tanah baru
    new_temp = thermal_model.step(
        current_t_soil=last_state.soil_temp_c,
        t_air=weather_stream.air_temp_c,
        moisture_pct=new_moisture,
        solar_rad_mj_per_hour=weather_stream.solar_radiation_mj / 24.0,
        dt_hours=0.25
    )
    
    # 4. Degradasi confidence score
    elapsed_hours = (now() - last_state.last_sensor_seen).total_seconds() / 3600.0
    confidence = max(0.50, 1.0 - (0.04 * elapsed_hours)) # Turun 4% per jam
    
    return FieldStateDTO(
        moisture_pct=new_moisture,
        soil_temp_c=new_temp,
        ph=last_state.ph, # pH diasumsikan konstan dalam jangka pendek
        is_predicted=True,
        confidence_score=confidence
    )
```

---

## 4. Rekonsiliasi Data saat Sensor Kembali Online (*Sensor Re-Attachment*)

Begitu node sensor berhasil mengirimkan kembali paket LoRa (misal: setelah sinyal pulih pada jam ke-7):
1. **Tidak Ada Lonjakan Tajuk (*No Graph Shock*):**
   Sistem tidak langsung mengganti nilai secara kasar jika ada deviasi kecil antara hasil prediksi Digital Twin dan bacaan sensor asli.
2. **Smoothing Filter (Exponential Moving Average):**
   Jika selisih $|\theta_{sensor} - \theta_{predicted}| \le 4.0\%$, sistem melakukan *blending* halus selama 2 siklus telemetri:
   $$\theta_{reconciled} = 0.7 \cdot \theta_{sensor} + 0.3 \cdot \theta_{predicted}$$
   Setelah 2 siklus, sistem kembali 100% ke mode `Live` (`is_predicted = False`).
3. **Pencatatan Riwayat Evaluasi:**
   Deviasi antara nilai prediksi Digital Twin dan nilai asli sensor dicatat ke log evaluasi untuk menghitung metrik performa model failover (MAE dan RMSE).

---

## 5. Visualisasi pada Antarmuka Pengguna (PWA Frontend)

Di aplikasi web yang dikembangkan Syifa, paket data hasil imputasi Digital Twin ditampilkan dengan indikator visual yang transparan namun tidak membuat petani panik:
* **Badge Khusus:** Di sebelah kartu suhu dan kelembaban, muncul label:  
  `[Est-Simulasi FAO-56 (Akurasi ~92%)]` dengan ikon awan/kompas berwarna biru muda.
* **Garis Putus-Putus pada Grafik Recharts:**
  Titik data live digambar dengan garis solid hijau, sedangkan titik data hasil estimasi imputasi digambar dengan **garis putus-putus (*dashed line*)**.
* **Kepercayaan Dewan Juri:**
  Fitur ini menjadi bukti kuat di hadapan dewan juri bahwa sistem VolatiSafe dirancang dengan ketahanan tinggi terhadap kondisi pedesaan Indonesia (*fault-tolerant architecture*).
