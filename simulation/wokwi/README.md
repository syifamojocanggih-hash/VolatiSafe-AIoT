# VolatiSafe AIoT — Wokwi Virtual Testbed (TKT 3)

Dokumen ini menjelaskan cara menjalankan simulasi perangkat keras IoT virtual VolatiSafe menggunakan simulator **Wokwi** untuk evaluasi dan demo seleksi proposal.

---

## 🛠️ Komponen Rangkaian Virtual (`diagram.json`)

1. **ESP32 DevKit v4** (MCU utama 240 MHz).
2. **Slide Potentiometer 1** (GPIO 34): Simulasi sensor kelembaban kapasitif v1.2 (10% s.d. 65% VWC).
3. **Slide Potentiometer 2** (GPIO 32): Simulasi modul sensor pH tanah analog (pH 5.00 s.d. 8.50).
4. **DS18B20 Digital Sensor** (GPIO 4): Sensor suhu tanah 1-Wire dengan resistor pull-up 4.7kΩ ke 3.3V.

---

## 🚀 Cara Menjalankan Simulasi

### Opsi 1: Menjalankan Langsung di Browser (Rekomendasi untuk Juri)
1. Buka [https://wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32).
2. Salin isi file `sketch.ino` ke tab **sketch.ino** di Wokwi.
3. Salin isi file `diagram.json` ke tab **diagram.json** di Wokwi.
4. Klik tombol **Play (Hijau)** untuk memulai simulasi.

### Opsi 2: Menggunakan Ekstensi VS Code Wokwi
1. Pasang ekstensi **Wokwi Simulator** di VS Code.
2. Buka folder `simulation/wokwi/`.
3. Tekan `F1` lalu pilih `Wokwi: Start Simulator`.

---

## 🎮 Pengujian 3 Skenario Lapangan (Interactive Demo Keys)

Pada Serial Monitor Wokwi (baud rate 115200), Anda dapat mengetikkan tombol perintah berikut untuk menguji respon sistem:

| Tombol | Skenario Pengujian | Parameter Sensor | Respon Sistem & Digital Twin |
|---|---|---|---|
| **`A`** | **Terik Ekstrem Siang** | Kelembaban: 21.0%, Suhu: 34.5°C, pH: 7.85 | Skor AVRI melompat ke **78% (Kritis)**. Dashboard menampilkan banner merah peringatan *"JANGAN TABUR UREA"*. |
| **`B`** | **Presipitasi Hujan Sore** | Kelembaban: 42.0%, Suhu: 26.0°C, pH: 6.80 | Skor AVRI turun ke **18% (Aman)**. Dashboard berubah hijau *"WAKTU TEPAT MENABUR UREA"*. |
| **`C`** | **Sensor Dropout / Offline** | Transmisi paket diputus | Node ditandai *Offline*. Digital Twin backend otomatis mengambil alih (*Failover Mode*) dengan estimasi difusi tanah FAO-56. |
| **`R`** | **Reset Sensor** | Mengikuti slider fisik potentiometer | Mengembalikan pembacaan ke slider potensiometer interaktif di canvas Wokwi. |

---

## 📡 Format Payload Telemetri (Strict Contract `TELEMETRY_PAYLOAD.md`)

```json
{"n":"VS-SIM-001","ts":1792934405,"m":22.4,"t":34.1,"ph":7.83,"b":3.88}
```
Payload ini kompatibel 100% dengan ingestion pipeline backend (`app/services/ingestion.py`) dan gateway MQTT adapter.
