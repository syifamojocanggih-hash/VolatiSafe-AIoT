# ROADMAP.md — Peta Jalan Pengembangan VolatiSafe AIoT

---

## 1. Fase 1: Sprint Prototipe Software TKT 3 (7 Hari — Batas 31 Okt 2026)

Target utama: Menghasilkan bukti purwarupa perangkat lunak tertutup (*closed-loop virtual testbed*) untuk lampiran proposal pendaftaran kompetisi Hackathon DeepTech for FoodTech Indonesia 2026.

| Hari | Target Luaran | Komponen Dilibatkan | PIC Domain |
|---|---|---|---|
| **H-1** | Setup repo, standardisasi kontrak `docs/universal/INTERFACES.md`, unduh dataset historis BMKG Lampung & Lamongan. | Docker, Postgres, Git | Universal / Backend |
| **H-2** | Bangun **Agro-Climatic Digital Twin** (persamaan neraca air FAO-56 & difusi panas tanah) tervalidasi dataset BMKG. | Python, NumPy, SimPy | AI Engine |
| **H-3** | Kembangkan **Firmware Wokwi ESP32** (sensor virtual kapasitif, suhu DS18B20, pH probe, LoRa bridge ke MQTT). | Wokwi, PlatformIO, Mosquitto | Hardware |
| **H-4** | Latih model **Physics-Informed ML (PIML)** LightGBM + modul TreeSHAP; evaluasi metrik MAE/AUC. | LightGBM, scikit-learn, shap | AI Engine |
| **H-5** | Bangun **Dashboard Next.js 14** (Dashboard Petak, Peta Risiko Leaflet, Kalkulator Pupuk, What-If Slider). | Next.js, Tailwind, Recharts | Frontend |
| **H-6** | Integrasi end-to-end Wokwi → MQTT → Digital Twin → AI → Dashboard. Eksekusi 3 skenario demo juri. | Seluruh Tim | All Agents |
| **H-7** | Rekam video demo 2 menit, tangkapan layar purwarupa, skema sirkuit 3D casing, finalisasi proposal 3 halaman. | Proposal & Media Pack | Tim Inti |

---

## 2. Fase 2: Fabrikasi & Deployment Hardware Fisik TKT 4–5 (Bulan 1–4)

*Dimulai setelah pengumuman 10 besar finalis dan pencairan insentif Rp3.000.000.*

- **Bulan 1:** Pengadaan komponen BoM fisik (10 unit ESP32, sensor kapasitif anti-korosi, DS18B20 probe, pH analog, SX1278 LoRa, box IP65).
- **Bulan 2:** Fabrikasi PCB & perakitan housing casing probe lapangan. Kalibrasi laboratorium sensor pH 2-titik (buffer 4.01 & 6.86).
- **Bulan 3:** Uji jangkauan telemetri LoRa di area terbuka kebun jagung (target 2–5 km dengan RSSI > -110 dBm).
- **Bulan 4:** Instalasi Gateway di base camp petani mitra Lamongan dan Lampung Tengah dengan koneksi seluler/WiFi stabil.

---

## 3. Fase 3: Validasi Empiris Lapangan TKT 6 (Bulan 5–12)

- **Uji Komparatif 2 Siklus Tanam:**
  - *Petak A (Bedeng AI):* Pemupukan Urea ditabur hanya saat sistem mengeluarkan rekomendasi "Jendela Aman" (AVRI < 30%).
  - *Petak B (Bedeng Kontrol):* Pemupukan mengikuti praktik kebiasaan petani setempat (berdasarkan kalender).
- **Pengukuran Metrik:**
  - Efisiensi pupuk (target penghematan Urea ≥ 20%).
  - Tonase panen jagung pipilan kering per hektar.
  - Akurasi prediksi AVRI terhadap laju emisi amonia aktual (diukur berkala dengan metode acid trap chamber).
- **Hasil Akhir:** Publikasi artikel ilmiah agronomi & peluncuran platform open-access untuk kelompok tani.
