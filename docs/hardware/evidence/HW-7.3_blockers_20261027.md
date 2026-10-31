# HW-7.3 - Blocker kuota Wokwi dan E2E

Tanggal : 27 Okt 2026
Status  : 🟨 sisi IoT A selesai; B/C dan dashboard belum

## E-01 (A - Terik)

✅ Sisi IoT selesai:
- `E01_serial.txt`: `[SENS] m=21.0% ph=7.85 t=34.50C b=3.87V`, lalu
  `[TX] KIRIM ok=1 attempts=1`.
- `E01_mqtt.txt`: topik persis, `q=0`, `r=0`, payload 71 byte.
- `E01_validation.txt`: `[OK] payload valid, 71 byte`.
- ❌ Dashboard PNG belum ada karena backend belum menerima data.

## E-02 (B - Hujan)

⛔ **Tidak bisa dijalankan**: setelah E01, `wokwi-cli` mengembalikan:

```
API Error: You have used up your Free plan monthly CI minute quota.
Please upgrade to a paid plan at https://wokwi.com/pricing.
```

Kuota CI bulanan akun Wokwi gratis habis. Build firmware tetap bisa, tetapi
simulasi CLI tidak. Log nilai B lama ada di `HW-4.3_scenario_b_20261027.txt`
(hanya `[SENS]`, tanpa TX/MQTT).

## E-03 (C - Dropout)

⛔ Butuh backend yang menyimpan `last_seen` dan failover Digital Twin. Karena
belum ada ingestion MQTT, tidak ada data yang bisa di-dropout.

## I-06 (DS18B20 terputus)

⛔ Tidak bisa dijalankan karena kuota Wokwi habis. `scenario_i06.yaml` sudah
disiapkan untuk dijalankan saat kuota tersedia.

## Opsi berikutnya

1. Tunggu kuota Wokwi reset / pakai akun berbayar untuk E02 + I-06.
2. Jalankan manual lewat VS Code jika kuota interaktif terpisah dari kuota CI.
3. Setelah backend/FE siap, ulangi E01-E03 untuk dashboard + alert.
4. Jangan klaim E2E penuh sebelum dashboard/alert benar-benar diuji.