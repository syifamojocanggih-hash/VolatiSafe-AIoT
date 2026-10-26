# Asal-Usul dan Sumber Data Parameter Digital Twin VolatiSafe AIoT

Dokumen ini menjelaskan secara transparan, terperinci, dan mudah dibaca (tanpa rumus LaTeX yang rumit) mengenai dari mana seluruh parameter yang digunakan oleh Digital Twin VolatiSafe AIoT diperoleh, bagaimana data tersebut diolah, serta instansi resmi mana yang menjadi rujukannya.

---

## 1. Ringkasan Prinsip: Dari Mana Angka Digital Twin Berasal?

Pada tahap purwarupa tertutup laboratorium (TKT 3), tim tidak mengarang angka secara acak. Seluruh parameter tanah dan iklim diturunkan dari dua pilar data nyata:

1. **Pilar Iklim & Cuaca Nyata:** Data rekaman resmi per jam dari Stasiun Meteorologi BMKG Tuban / Lamongan Utara (WMO ID: 96933).
2. **Pilar Karakteristik Tanah Nyata:** Peta tanah geospasial Balai Besar Litbang Sumberdaya Lahan Pertanian (BBSDLP) Kementerian Pertanian RI dan basis data global ISRIC SoilGrids resolusi 250 meter kerja sama FAO/PBB tepat pada koordinat Kecamatan Solokuro, Lamongan (7.12° LS, 112.41° BT).

---

## 2. Rincian Sumber 15 Parameter Digital Twin

### Kelompok A: Parameter Masukan Cuaca (Dari BMKG Lamongan)

Data ini disuplai per jam atau per interval simulasi dari file rekaman `simulations/data_replay/datasets/bmkg_lamongan.csv`:

1. **Suhu Udara (air_temp_c)**
   * **Sumber Data:** Sensor termometer sangkar cuaca Stasiun BMKG Tuban/Lamongan (WMO 96933).
   * **Rentang Nilai:** 21.0°C (pagi/malam) hingga 37.0°C (siang terik).
   * **Fungsi:** Menggerakkan proses pemanasan lapisan tanah dan menentukan laju penguapan udara.

2. **Kelembaban Relatif Udara (humidity_rh)**
   * **Sumber Data:** Higrometer BMKG Tuban/Lamongan.
   * **Rentang Nilai:** 38% (siang kering kemarau) hingga 99% (saat hujan/subuh).
   * **Fungsi:** Menentukan apakah udara di atas sawah bersifat kering (menyedot uap air) atau lembap jenuh (menahan penguapan).

3. **Kecepatan Angin (wind_speed_ms)**
   * **Sumber Data:** Anemometer ketinggian 2 meter BMKG Tuban/Lamongan.
   * **Rentang Nilai:** 0.3 m/s (tenang) hingga 8.5 m/s (hembusan angin kencang pesisir pantai utara Lamongan).
   * **Fungsi:** Menghitung faktor aerodinamika yang menyapu lapisan gas amonia di atas permukaan tanah.

4. **Radiasi Sinar Matahari (solar_radiation_mj)**
   * **Sumber Data:** Pyranometer surya BMKG Tuban/Lamongan.
   * **Rentang Nilai:** 0.0 MJ/m2 (malam) hingga 3.8 MJ/m2 (siang hari pukul 11.00-13.00 WIB).
   * **Fungsi:** Sumber energi panas utama yang memicu penguraian pupuk urea dan evaporasi air tanah.

5. **Curah Hujan (precipitation_mm)**
   * **Sumber Data:** Penakar hujan Hellmann / otomatis BMKG Tuban/Lamongan.
   * **Rentang Nilai:** 0.0 mm (kering) hingga 45.0 mm (hujan lebat).
   * **Fungsi:** Menambah volume air ke dalam tanah, melarutkan butiran pupuk urea ke dalam lapisan perakaran, dan meredam penguapan gas amonia.

---

### Kelompok B: Parameter Karakteristik Fisik Tanah (Berdasarkan Geografi Solokuro, Lamongan)

Data ini merupakan sifat fisik alami tanah di kawasan perbukitan kapur tegalan Solokuro yang diambil dari data spasial resmi Kementerian Pertanian (BBSDLP) dan ISRIC SoilGrids:

6. **Tekstur Tanah Karst Solokuro (Clay, Sand, Silt)**
   * **Sumber Data:** Peta Tekstur Tanah ISRIC SoilGrids resolusi 250 meter pada koordinat tegalan Solokuro (7.12° LS, 112.41° BT).
   * **Komposisi Nyata:**
     * Fraksi Liat (Clay): 38.0%
     * Fraksi Pasir (Sand): 24.0%
     * Fraksi Debu (Silt): 38.0%
   * **Klasifikasi USDA:** Lempung Berliat (Clay Loam) atau Mediteran Merah Kapur (Terra Rossa).
   * **Fungsi:** Menentukan seberapa kuat tanah menahan air dan seberapa cepat panas merambat ke perakaran.

7. **Kapasitas Lapang (Field Capacity / theta_fc = 39.5% VWC)**
   * **Sumber Data:** Dihitung menggunakan rumus hidrologi baku Saxton & Rawls (2006) yang diterbitkan oleh Soil Science Society of America Journal, berdasarkan persentase liat 38% dan pasir 24% di atas.
   * **Artinya:** Batas maksimal tanah Solokuro mampu menahan air setelah kelebihan air hujan meresap ke bawah tanah. Di atas angka 39.5%, air tanah akan meluap/mengalir sebagai air gravitasi.

8. **Titik Layu Permanen (Wilting Point / theta_wp = 13.8% VWC)**
   * **Sumber Data:** Dihitung menggunakan rumus Saxton & Rawls (2006) pada tekanan hisap akar -1500 kPa.
   * **Artinya:** Batas kekeringan ekstrem tanah karst. Jika kadar air tanah turun hingga menyentuh 13.8%, akar tanaman jagung sudah tidak mampu lagi menyerap air dan daun akan layu permanen.

9. **Kerapatan Tanah (Bulk Density = 1.34 g/cm3)**
   * **Sumber Data:** Basis data profil tanah BBSDLP Kementan untuk tanah Mediteran Jawa Timur.
   * **Fungsi:** Menentukan kepadatan pori tanah kapur untuk konversi volume air milimeter ke persentase kadar air volumetrik (% VWC).

10. **Baseline pH Tanah Makro (ph_baseline = 7.85)**
    * **Sumber Data:** Peta Status Kimia dan Kesuburan Tanah BBSDLP Kementerian Pertanian untuk wilayah Lamongan Utara.
    * **Artinya:** Tanah Solokuro terbentuk dari pelapukan batuan kapur (kalsium karbonat / CaCO3), sehingga pH alaminya bersifat basa/alkalin (antara 7.6 hingga 8.2), bukan masam.

---

### Kelompok C: Parameter Dinamis yang Dihitung Otomatis oleh Digital Twin

Tiga parameter inilah yang nilainya bergerak dinamis setiap saat di layar sistem:

11. **Kadar Air Tanah Aktual (moisture_pct atau theta)**
    * **Bagaimana Cara Menghitungnya?**
      Digital Twin menjalankan neraca air harian standar badan PBB (FAO-56 Penman-Monteith):
      * **Air Masuk:** Dari data hujan BMKG Lamongan.
      * **Air Keluar:** Dari evapotranspirasi aktual (ETc), yaitu total air yang disedot oleh panas matahari dan dihisap oleh daun tanaman jagung.
      * Nilai akhir dibatasi agar selalu berada di antara Titik Layu (13.8%) dan Kapasitas Lapang (39.5%).
    * **Perilaku Nyatanya:** Saat siang hari tanpa hujan, kadar air berkurang sekitar 0.15% hingga 0.20% per jam. Saat turun hujan, kadar air melonjak naik seketika.

12. **Suhu Tanah Lapisan 5-10 cm (soil_temp_c)**
    * **Bagaimana Cara Menghitungnya?**
      Menggunakan hukum perambatan panas (Persamaan Fourier 1D). Tanah memiliki sifat inersia termal (tidak langsung panas seperti udara):
      * Suhu tanah bergerak mendekati suhu udara luar BMKG dengan koefisien redaman yang bergantung pada kadar air.
      * Tanah yang basah sulit menjadi panas karena air menahan suhu.
      * Tanah yang kering cepat membara menjadi panas.
    * **Perilaku Nyatanya:** Menghasilkan fase tunda alami selama 60 hingga 90 menit. Saat terik matahari mencapai puncak pada pukul 12.15 WIB, suhu tanah di kedalaman 5 cm baru mencapai titik terpanasnya pada pukul 13.30 WIB.

13. **Derajat Keasaman Tanah Berjalan (ph)**
    * **Bagaimana Cara Menghitungnya?**
      * Pada kondisi normal, nilainya berakar pada baseline geologis kapur Solokuro (pH 7.85).
      * Saat tanah mengalami kekeringan ekstrem (kadar air di bawah 20%), kepekatan ion kalsium tanah meningkat sehingga model sedikit mengoreksi pH naik hingga 8.0 - 8.1.
      * Pada unit fisik di sawah, angka ini dibaca langsung oleh elektroda probe pH analog yang terpasang di mikrokontroler ESP32.

---

### Kelompok D: Parameter Tanaman Jagung & Kinetika Reaksi Kimia

14. **Umur Tanaman (DAT / Days After Transplanting) & Koefisien Jagung (Kc)**
    * **Sumber Data:** Tabel agronomi tanaman jagung panduan FAO-56 (Food and Agriculture Organization, Roma).
    * **Nilai:**
      * Bibit Baru Tumbuh (0-14 HST): Koefisien Kc = 0.40 (daun sedikit, air keluar sedikit).
      * Pertumbuhan Cepat / Pemupukan Kedua (30-40 HST): Koefisien Kc = 0.85 (fase tanaman jagung Pak Suparman saat ini).
      * Pembungaan dan Tongkol (50-65 HST): Koefisien Kc = 1.15 (konsumsi air harian paling tinggi).
    * **Fungsi:** Mengatur berapa milimeter air tanah yang disedot tanaman jagung setiap harinya.

15. **Laju Reaksi Enzim Urease (k_urease)**
    * **Sumber Data:** Riset kinetika tanah Kissel & Cabrera (2005) dari University of Georgia Bulletin 245.
    * **Nilai Tetap:** Energi aktivasi reaksi hidrolisis urea adalah 51.000 Joule per mol.
    * **Cara Kerja:** Menghitung seberapa cepat butiran pupuk urea terurai menjadi gas amonia berdasarkan suhu tanah aktual. Pada suhu 24°C reaksi lambat, tetapi pada suhu 35°C laju penguraian pupuk melonjak lebih dari 200%.

---

## 3. Alur Hubungan Data (Bagan Alir Sederhana)

```
[ DATA CUACA RIIL BMKG LAMONGAN ]        [ DATA TANAH RESMI BBSDLP & SOILGRIDS ]
- Suhu Udara                             - Tekstur: Liat 38%, Pasir 24%
- Sinar Matahari                         - Kapasitas Lapang: 39.5%
- Kecepatan Angin                        - Titik Layu: 13.8%
- Curah Hujan                            - pH Baseline Karst: 7.85
                \                                      /
                 \                                    /
                  ▼                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │             MESIN BIOFISIKA DIGITAL TWIN               │
      │                                                        │
      │ 1. Neraca Air FAO-56    ---> Hasil: moisture_pct       │
      │ 2. Difusi Panas Fourier ---> Hasil: soil_temp_c        │
      │ 3. Buffer Kapur         ---> Hasil: ph                 │
      │ 4. Kinetika Arrhenius   ---> Hasil: laju penguapan     │
      └───────────────────────────┬────────────────────────────┘
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │          MODEL AI LIGHTGBM + KEPUTUSAN SISTEM          │
      │                                                        │
      │ Menentukan: AVRI (Indeks Risiko Penguapan Pupuk 0-100%)│
      │ Rekomendasi: Waktu Jam Aman Pemupukan Bagi Petani      │
      └────────────────────────────────────────────────────────┘
```

---

## 4. Kesimpulan untuk Verifikasi dan Pengujian

Seluruh angka yang ada pada dashboard Digital Twin bukan hasil rekayasa atau angka acak:
1. **Lokasi:** Terikat secara nyata pada koordinat sentra jagung Solokuro, Lamongan.
2. **Karakteristik Fisik:** Berasal dari basis data pemetaan tanah resmi Kementerian Pertanian RI dan FAO SoilGrids.
3. **Kondisi Dinamis:** Digerakkan oleh data iklim resmi BMKG stasiun terdekat.
4. **Metodologi:** Diakui secara ilmiah dan mematuhi standar etika penelitian TKT 3 sebelum dilanjutkan ke tahap pengambilan sampel tanah laboratorium fisik pada TKT 4.
