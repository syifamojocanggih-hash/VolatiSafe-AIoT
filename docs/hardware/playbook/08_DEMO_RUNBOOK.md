# 08_DEMO_RUNBOOK.md — Menjalankan Demo & Merekam Video Juri

> **Dipakai pada:** FASE 8 (HW-8.1 … HW-8.4)
> **Batas pengumpulan:** 31 Oktober 2026
> **Durasi target video:** 2 menit

---

## 1. Prinsip Demo

1. **Rekam, jangan live.** Demo langsung ke juri berisiko: Wokwi butuh waktu boot, broker bisa mati, WiFi kampus tidak stabil. Video yang direkam = satu-satunya jalur aman.
2. **Satu kali ambil, banyak kali edit.** Rekam tiap segmen terpisah, gabungkan di edit. Jangan berusaha menyelesaikan 2 menit dalam satu take.
3. **Siapkan narasi tertulis sebelumnya.** Baca sambil rekam; jangan improvisasi.
4. **Tunjukkan bukti teknis, bukan animasi.** Juri DeepTech akan curiga pada dashboard cantik tanpa sumber data. Tampilkan Serial + `mosquitto_sub` + dashboard dalam satu frame bila memungkinkan.

---

## 2. Checklist H-1 (30 Oktober)

### 2.1 Teknis

- [ ] `pio run -e esp32dev` → `SUCCESS`
- [ ] `pio run -e wokwi` → `SUCCESS`
- [ ] `pio test -e native` → semua PASS
- [ ] Lisensi Wokwi aktif, **kuota simulasi tersisa cukup**
- [ ] Mosquitto berjalan dan di-set autostart (`docker restart unless-stopped` atau service)
- [ ] Backend Syifa berjalan: `GET http://localhost:8000/api/v1/health` merespons
- [ ] Dashboard terbuka tanpa error di browser yang akan direkam
- [ ] Telegram/WA alert terkirim (uji sekali ke nomor sendiri)
- [ ] `simulation/wokwi/diagram.json` + `wokwi.toml` ter-commit
- [ ] Payload contoh tersimpan di `docs/hardware/evidence/`

### 2.2 Cadangan (fallback)

- [ ] Rekaman layar setiap skenario **sudah** diambil H-1 (tanpa narasi)
- [ ] Screenshot dashboard tiap skenario disimpan
- [ ] File teks payload tiap skenario disimpan untuk disisipkan bila live gagal
- [ ] Video cadangan versi tanpa narasi tersimpan di dua tempat (lokal + cloud)

### 2.3 Media

- [ ] Resolusi rekaman 1920×1080, 30 fps
- [ ] Font terminal diperbesar (≥16 pt) agar terbaca di video
- [ ] Zoom browser 125 % agar dashboard terbaca
- [ ] Notifikasi sistem dimatikan (Windows: Focus Assist / Do Not Disturb)
- [ ] Wallpaper netral, tidak ada jendela pribadi terlihat
- [ ] Mikrofon diuji, tidak ada echo

---

## 3. Urutan Persiapan Teknis (T-60 menit)

Jalankan **berurutan**. Jangan melompati langkah.

```
T-60  docker start voltisafe-mqtt          (atau: mosquitto -p 1883 -v)
T-55  mosquitto_sub -t "/volatisafe/v1/node/+/telemetry" -v     (terminal 1, biarkan)
T-50  backend Syifa: uvicorn ... --reload                        (terminal 2)
T-45  buka dashboard di browser                                  (jendela 1)
T-40  pio run -e wokwi                                           (terminal 3)
T-35  code simulation\wokwi  ->  Wokwi: Start Simulator
T-30  verifikasi: payload muncul di terminal 1, grafik bergerak di dashboard
T-20  atur potensiometer ke Skenario A, tunggu 2 paket
T-15  cek alert Telegram/WA masuk
T-10  mulai rekaman segmen 1
```

**Jangan** menutup terminal 1 (`mosquitto_sub`) selama rekaman — output itulah bukti bahwa data benar-benar mengalir.

---

## 4. Skrip Video 2 Menit

Total ±300 kata. Baca dengan tempo santai (±150 kata/menit).

### 3.1 Segmen 1 — Masalah (0:00–0:20)

**Visual:** layar dashboard dengan banner merah, atau foto lahan jagung kering.

```
Narasi:
"Petani jagung di Lampung dan Lamongan menabur urea berdasarkan kalender,
bukan berdasarkan kondisi tanah. Akibatnya nitrogen menguap sebagai amonia
sebelum diserap akar. Kerugiannya mencapai puluhan persen pupuk.
Pertanyaannya bukan berapa banyak pupuk, tapi jam berapa harus menabur."
```

### 3.2 Segmen 2 — Arsitektur (0:20–0:40)

**Visual:** rangkaian Wokwi (ESP32 + 3 sensor + DS18B20), lalu Serial monitor yang menampilkan payload.

```
Narasi:
"VolatiSafe memasang node ESP32 dengan tiga sensor tanah: kelembaban kapasitif,
suhu DS18B20, dan pH. Node mengambil lima sampel, memfilter noise, mengoreksi
pH terhadap kelembaban, lalu mengirim payload ringkas lewat LoRa 433 MHz.
Pada fase prototipe ini, hop radio disimulasikan melalui MQTT — firmware,
payload, dan logika sensornya identik dengan yang akan dipasang di lapangan."
```

**Catatan:** kalimat terakhir wajib diucapkan. Jangan menyembunyikan bahwa LoRa belum diuji.

### 3.3 Segmen 3 — Skenario A: Terik (0:40–1:10)

**Visual:** geser potensiometer ke 21 %, ubah DS18B20 ke 34,5 °C; tunjukkan Serial → `mosquitto_sub` → dashboard berubah merah.

```
Narasi:
"Sekarang kondisi terik ekstrem. Kelembaban dua puluh satu persen,
suhu tanah tiga puluh empat koma lima derajat, pH tujuh koma delapan lima.
Node mengirim paket ini. Digital twin mendeteksi defisit air perakaran.
Model AI menghitung skor risiko volatilisasi di atas tujuh puluh persen —
kategori kritis. Dashboard menampilkan peringatan merah: jangan tabur urea
sekarang. Dan notifikasi WhatsApp masuk ke ponsel petani dengan jendela
aman terdekat, besok pukul enam pagi."
```

### 3.4 Segmen 4 — Skenario B: Hujan (1:10–1:35)

**Visual:** geser ke 42 %, suhu 26 °C; dashboard berubah hijau.

```
Narasi:
"Hujan turun. Kelembaban naik ke empat puluh dua persen, suhu tanah turun ke
dua puluh enam derajat. Neraca air FAO-56 diperbarui. Enzim urease terlarut,
penguapan amonia turun drastis. Skor risiko turun ke bawah dua puluh persen —
kategori aman. Dashboard hijau: waktu tepat menabur urea, jendela aman terbuka
seratus dua puluh menit ke depan."
```

### 3.5 Segmen 5 — Skenario C: Dropout (1:35–1:50)

**Visual:** node dihentikan; grafik tetap berjalan dengan garis putus-putus + label `[Est-Simulated]`.

```
Narasi:
"Bagaimana kalau node mati? Kami mematikan node selama tiga puluh lima menit.
Gateway menandai offline. Digital twin mengambil alih dengan estimasi FAO-56
dan difusi termal. Grafik tetap kontinu, ditandai sebagai estimasi. Sistem
tidak pernah menampilkan kekosongan data kepada petani."
```

### 3.6 Segmen 6 — Penutup (1:50–2:00)

**Visual:** dashboard + logo + timeline TKT.

```
Narasi:
"Prototipe ini berjalan end-to-end hari ini. Setelah insentif, kami fabrikasi
sembilan node fisik dan gateway, lalu mulai uji lapangan pada dua siklus tanam
jagung. VolatiSafe — menabur di waktu yang tepat."
```

---

## 5. Rencana Fallback

| Kegagalan | Gejala | Tindakan |
|---|---|---|
| Wokwi tidak boot | Loading > 60 detik | Potong segmen, sisipkan rekaman H-1 |
| Mosquitto tidak menerima | Terminal 1 kosong | Cek topik (garis miring depan), cek firewall, restart broker, gunakan rekaman |
| Dashboard tidak update | Grafik diam | Cek WebSocket, restart backend, gunakan screenshot |
| Alert tidak terkirim | Tidak ada notifikasi | Tampilkan screenshot alert dari uji H-1, sebutkan "terkirim pada uji pukul ..." |
| Potensiometer tidak presisi | Nilai meleset | Tunjukkan nilai **aktual**, sebutkan angkanya; jangan pura-pura |
| Laptop lemot saat merekam | Frame drop | Turunkan resolusi ke 1280×720, tutup aplikasi lain |

**Aturan emas:** bila sesuatu gagal, **potong dan ambil ulang segmen**, jangan menambal dengan narasi palsu.

---

## 6. Apa yang Tidak Boleh Diklaim

| Jangan ucapkan | Ucapkan ini |
|---|---|
| "LoRa sudah diuji 5 km" | "Target desain 2–5 km; pengukuran terjadwal fase berikutnya" |
| "Konsumsi daya terukur 10 µA" | "Estimasi arsitektur 0,057 mAh per siklus; pengukuran pada prototipe fisik" |
| "Akurasi sensor 99 %" | "Kalibrasi dua titik; akurasi lapangan akan divalidasi di TKT 6" |
| "Payload 52 byte" | "Payload JSON terukur 70 byte; format biner 13 byte tersedia untuk jarak ekstrem" |
| "Sudah dipakai petani" | "Dirancang bersama kebutuhan petani mitra; uji lapangan setelah insentif" |
| "AI memprediksi emisi amonia" | "Model menghitung indeks risiko volatilisasi; validasi terhadap emisi aktual di TKT 6" |

Jika ditanya hal di luar cakupan, jawab: *"Itu di luar fase prototipe ini; masuk rencana TKT 4–6."* Jangan mengarang angka.

---

## 7. Deliverable Demo

| # | Item | Lokasi | Catatan |
|---|---|---|---|
| 1 | Video 2 menit | Google Drive / YouTube unlisted | Jangan commit ke repo |
| 2 | Screenshot rangkaian Wokwi | `docs/hardware/evidence/wokwi_diagram.png` | Resolusi penuh |
| 3 | Screenshot dashboard A/B/C | `evidence/E01..E03_dashboard.png` | |
| 4 | Log Serial + MQTT | `evidence/E01..E03_*.txt` | |
| 5 | Link proyek Wokwi | Di proposal | Pastikan bisa dibuka orang lain |
| 6 | Narasi tertulis | `docs/hardware/evidence/narasi_video.md` | Untuk subtitle / juri yang tidak menonton audio |

### 7.1 Cara memastikan link Wokwi bisa dibuka

1. Buka proyek di wokwi.com.
2. `Save` → pastikan status **Public**, bukan private.
3. Buka di jendela incognito → harus bisa dibuka tanpa login.
4. Salin URL, simpan di `evidence/wokwi_link.txt`.

Jika memakai VS Code (bukan web), tidak ada link publik. Alternatif: unggah `diagram.json` + firmware `.ino`/ELF ke proposal sebagai lampiran, atau buat proyek web terpisah khusus demo (duplikasi `diagram.json`, salin kode dari `firmware/src`).

---

## 8. Setelah Rekaman

- [ ] Tonton ulang video, cek: tidak ada notifikasi pribadi, tidak ada password terlihat
- [ ] Cek angka yang diucapkan cocok dengan angka di layar
- [ ] Unggah video, set unlisted
- [ ] Simpan tautan di `evidence/video_link.txt`
- [ ] Update status board [`00_INDEX.md`](00_INDEX.md) FASE 8
- [ ] Kirim paket serah terima ke Syifa ([`10_DEFINISI_SELESAI.md`](10_DEFINISI_SELESAI.md) §4)
- [ ] Buat PR `iot` → `Development`
