# MERGE_IOT_MAIN - Integrasi domain IoT ke main

Tanggal : 31 Okt 2026
PR      : https://github.com/syifamojocanggih-hash/VolatiSafe-AIoT/pull/1

## 1. Posisi Branch Sebelum Merge

| Ref | SHA | Keterangan |
|---|---|---|
| `main` | `2ca64ff` | Target merge |
| `origin/iot` | `99a7580` | Remote IoT sebelum commit lokal |
| `iot` | `ae763f2` | Remote IoT setelah 4 commit baru |

`git merge-base main iot` menghasilkan `2ca64ff`, yaitu HEAD `main`. Dengan kata lain `main` adalah ancestor `iot`, sehingga tidak ada perubahan di sisi `main` yang bisa bentrok.

## 2. Commit yang Ditambahkan

| Commit | Isi |
|---|---|
| `ba36645` | SD store-and-forward dan placeholder pH/baterai |
| `07ea1d7` | Pembaruan dokumen hardware untuk ESP32-WROOM-32D dan microSD |
| `cd05cb1` | Bukti HW-9.1: log Serial, temuan bench, unit test |
| `ae763f2` | Pembaruan diagram dan skenario Wokwi |

Rebase ke `origin/iot` (`99a7580`) berhasil tanpa conflict. Satu-satunya perubahan dari remote adalah penambahan `.gitignore` di root.

## 3. Verifikasi Sebelum Merge

| Perintah | Hasil |
|---|---|
| `pio test -e native` | 45/45 PASS |
| `pio run -e esp32dev` | SUCCESS, RAM 14,6%, Flash 81,6% |
| `pio run -e wokwi` | SUCCESS, RAM 14,6%, Flash 81,2% |
| `git diff --check` | Hanya trailing whitespace di beberapa dokumen, tidak memblokir |

## 4. Catatan

- Flash `esp32dev` berada di 81,6%, di atas ambang waspada 80%. Penyebabnya WiFi, MQTT, dan SD dalam satu build. Detail ada di `HW-9.1_bench_findings_20261031.md`.
- Kalibrasi moisture dan deteksi modul SD masih perlu tindak lanjut. Keduanya bukan blocker integrasi.
- Hasil merge dan status pemeriksaan tercatat di PR #1.
