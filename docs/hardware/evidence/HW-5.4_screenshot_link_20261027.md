# Status screenshot & link Wokwi - 27 Okt 2026

## Screenshot rangkaian

Percobaan otomatis:

```
wokwi-cli . --timeout 25000 --screenshot-part esp --screenshot-time 6000 \
  --screenshot-file docs/hardware/evidence/wokwi_diagram.png
```

Hasil: `Error 1: Part does not have a valid framebuffer: esp`.
Board ESP32 tidak punya framebuffer yang bisa ditangkap `--screenshot-part`.
Screenshot rangkaian harus diambil manual dari UI Wokwi (VS Code webview atau
wokwi.com) memakai alat screenshot Windows. File target:
`docs/hardware/evidence/wokwi_diagram.png`.

## Link publik Wokwi

Akun yang dipakai gratis dan proyek ini berjalan lewat VS Code/CLI, bukan
proyek wokwi.com. Belum ada link publik. Alternatif sesuai
`docs/hardware/playbook/08_DEMO_RUNBOOK.md` 7.1: lampirkan `diagram.json` +
firmware `.bin`/`.elf`, atau buat proyek web terpisah khusus demo. Ditunda ke
HW-8.2 (Demo & Handover).

## Yang sudah ada

- `diagram.json`, `wokwi.toml`, 7 skenario, `README.md`.
- Screenshot tidak menghalangi HW-5.3/HW-5.4; keduanya sudah punya bukti teks.
