# Status screenshot & link Wokwi - 27 Okt 2026

## Screenshot rangkaian

Percobaan CLI:

```
wokwi-cli . --timeout 25000 --screenshot-part esp --screenshot-time 6000 \
  --screenshot-file docs/hardware/evidence/wokwi_diagram.png
```

Hasil: `Error 1: Part does not have a valid framebuffer: esp`.
Board ESP32 tidak punya framebuffer yang bisa ditangkap `--screenshot-part`.

Solusi yang dipakai: buka proyek di VS Code, jalankan
**Wokwi: Start Simulator**, lalu capture window simulator. Hasil:

- `docs/hardware/evidence/wokwi_diagram.png` — crop panel simulator 1270x490
- `docs/hardware/evidence/wokwi_diagram_full.png` — window penuh 1920x1080

Rangkaian yang terlihat: ESP32 + 3 potensiometer + DS18B20 + resistor pull-up.
Screenshot diambil 27 Okt 2026.

## Link publik Wokwi

Akun yang dipakai gratis dan proyek ini berjalan lewat VS Code/CLI, bukan
proyek wokwi.com. Belum ada link publik. Alternatif sesuai
`docs/hardware/playbook/08_DEMO_RUNBOOK.md` 7.1: lampirkan `diagram.json` +
firmware `.bin`/`.elf`, atau buat proyek web terpisah khusus demo. Ditunda ke
HW-8.2 (Demo & Handover).

## Yang sudah ada

- `diagram.json`, `wokwi.toml`, 9 skenario, `README.md`.
- Screenshot rangkaian sudah ada (`wokwi_diagram.png` + full).
- Yang belum: link publik Wokwi.
- Screenshot tidak menghalangi HW-5.3/HW-5.4; keduanya sudah punya bukti teks.
