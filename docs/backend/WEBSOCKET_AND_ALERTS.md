# WEBSOCKET_AND_ALERTS.md — Streaming WebSocket & Gateway Notifikasi

---

## 1. WebSocket Live Stream (`/ws/v1/live`)

Frontend terhubung ke WebSocket backend untuk menerima pembaruan telemetri dan status risiko seketika tanpa melakukan *polling* berulang yang boros kuota:

### 1.1 Siklus Sambungan & Heartbeat
- **URL Sambungan:** `ws://localhost:8000/ws/v1/live?client_id={id}`
- **Ping / Pong:** Klien mengirimkan string `"ping"` setiap 30 detik; backend membalas `"pong"` untuk menjaga koneksi tetap hidup (*keep-alive*).

### 1.2 Event Telemetri Real-Time (`TELEMETRY_UPDATE`)
Dipancarkan ke semua klien aktif begitu data baru selesai diproses oleh ingestion pipeline:
```json
{
  "event": "TELEMETRY_UPDATE",
  "data": {
    "node_id": "VS-A1-003",
    "field_id": "BLOK-A",
    "timestamp": "2026-10-24T16:15:00Z",
    "moisture_pct": 22.1,
    "soil_temp_c": 34.3,
    "ph": 7.84,
    "avri_score": 75.1,
    "risk_category": "kritis",
    "is_predicted": false
  }
}
```

---

## 2. Integrasi Notifikasi WhatsApp (Fonnte / Wablas API)

### 2.1 Kriteria Pemicu Pesan (Trigger Rules)
1. **Peringatan Risiko Kritis (Immediate Alert):** Dipicu seketika jika skor AVRI melompat ke kategori Kritis/Bahaya (> 60%) pada jendela jam kerja petani (05:00 – 17:00 WIB).
2. **Preskripsi Harian (Daily Digest):** Dikirim setiap pukul 05:30 pagi berisi rekomendasi jendela pemupukan untuk hari tersebut.
3. **Pengingat Logistik H-3:** Dikirim 3 hari sebelum tanaman jagung memasuki fase pemupukan kritis (V8 dan V12).

### 2.2 Template Pesan WhatsApp Lapangan

**A. Template Peringatan Risiko Kritis:**
```text
VolatiSafe AIoT · Kebun Jagung Blok A

🔴 PERINGATAN RISIKO KRITIS: 74%
Jangan tabur pupuk Urea sekarang!

Kondisi Lahan Terkini:
• Suhu Tanah : 34.1°C (Sangat Panas)
• Kelembaban : 22.4% (Kering)
• pH Tanah   : 7.83 (Basa / Berkapur)

⚠️ Potensi penguapan amonia ke udara mencapai 74%. Pupuk Anda akan terbuang percuma dan daun jagung tetap menguning.

✅ Jendela Aman Terdekat:
Besok Pagi, pukul 06:00 – 09:00 WIB (Risiko 18%)

Buka Panduan: https://volatisafe.id/petak/BLOK-A
```

**B. Template Pengingat Logistik H-3:**
```text
Halo Pak Suparman,

3 hari lagi (Jumat, 14 Nov) tanaman jagung Anda memasuki umur 30 HST (Fase V8 - Pemupukan Susulan I).

Kebutuhan Pupuk Lahan 0.75 ha:
• 1.5 Karung Urea (isi 50 kg)
• 1.5 Karung NPK Phonska 15-15-15

Segera tebus/siapkan pupuk di Kios Tani Desa. VolatiSafe akan memantau kondisi cuaca untuk memilih jam penaburan terbaik di hari aplikasi.
```

---

## 3. Integrasi Telegram Bot (Kanal Grup & Demonstrasi Juri)

Untuk kemudahan pengujian demo day juri tanpa biaya pulsa WhatsApp:
- **Bot Username:** `@VolatiSafeAlertBot`
- **Fitur Inline Keyboard:**
  - Tombol `[Lihat Dashboard Live]`: Membuka Web App.
  - Tombol `[Sudah Saya Tunda]`: Mencatat konfirmasi petani di database bahwa aplikasi pupuk ditunda demi efisiensi.
  - Tombol `[Tetap Tabur (Override)]`: Mencatat log override jika petani tetap menabur (untuk audit riset komparatif).
