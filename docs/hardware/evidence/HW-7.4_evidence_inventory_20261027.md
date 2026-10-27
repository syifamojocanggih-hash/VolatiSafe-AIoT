# HW-7.4 - Inventaris bukti FASE 7

Tanggal : 27 Okt 2026
Acuan   : `07_TEST_PLAN.md` 6 (12 item bukti wajib)

| # | Bukti | Status | File / catatan |
|---|---|---|---|
| 1 | Build fisik | ✅ | `build_esp32dev.txt` |
| 2 | Build simulasi | ✅ | `build_wokwi.txt` |
| 3 | Unit test lulus | ✅ | `unit_test_native_20261027.txt` (45 PASS) |
| 3a | Payload + sensors_core | ✅ | `unit_test_native_20261026.txt` |
| 3b | calibration_core | ✅ | `unit_test_native_20261026.txt` |
| 3c | ADC burst + median | ✅ | `HW-2.1_adc_burst_wokwi_20261026.txt` |
| 3d | DS18B20 | ✅ | `HW-2.2_ds18b20_wokwi_20261026.txt` |
| 3e | NVS kosong/round-trip | ✅ | `HW-2.6_nvs_selftest_wokwi_20261026.txt` |
| 3f | Lint diagram | ✅ | `HW-5.1_diagram_lint_20261026.txt` |
| 3g | Skenario A/B | ✅ | `HW-5.2_wokwi_scenario_ab_20261026.txt` |
| 3h | Short/putus tanpa clamp | ✅ | `HW-3.1_no_clamp_wokwi_20261026.txt` |
| 3i | LoRa build + isolasi | ✅ | `HW-3.3_lora_transport_20261026.txt` |
| 3j | MQTT topik/payload/retry | ✅ | `HW-3.4_mqtt_transport_20261026.txt` |
| 3k | Power gate | ✅ | `HW-4.1_power_gate_20261027.txt` |
| 3l | Deep sleep/wake | ✅ | `HW-4.2_deep_sleep_20261027.txt` |
| 3m | Orkestrasi + regresi | ✅ | `HW-4.3_orchestration_20261027.txt`, `HW-4.3_scenario_*` |
| 3n | Power budget | ✅ | `HW-4.4_power_budget_20261027.md` |
| 3o | Paritas firmware | ✅ | `HW-5.3_parity_20261027.txt` |
| 3p | Topik/QoS/retain | ✅ | `HW-6.1_topic_qos_retain_20261027.txt`, `HW-6.1_verification_20261027.md` |
| 3q | Adapter backend | ✅ | `HW-6.2_adapter_test_20261027.txt`, `HW-6.2_backend_findings_20261027.md` |
| 4 | Payload sampai broker | ✅ | `I03_mqtt_rx.txt` |
| 5 | Hex dump payload | ✅ | `payload_hexdump.txt` |
| 6 | Integrasi ke backend | ⛔ | Backend belum punya MQTT worker; `HW-7.2_backend_blocker_20261027.md` |
| 7 | Skenario A | 🟨 | `E01_serial.txt`, `E01_mqtt.txt`, `E01_validation.txt`; dashboard PNG belum |
| 8 | Skenario B | ⛔ | Kuota CI Wokwi gratis habis; log `[SENS]` B lama ada di `HW-4.3_scenario_b_20261027.txt` |
| 9 | Skenario C | ⛔ | Butuh backend/failover; belum ada data masuk |
| 10 | Screenshot rangkaian | ⛔ | `wokwi-cli` tidak punya framebuffer board; perlu manual UI |
| 11 | Video demo | ⛔ | FASE 8; butuh dashboard/backend |
| 12 | Baseline RAM/Flash | ✅ | `07_TEST_PLAN.md` 5.1 |

## Catatan penting

- **Kuota Wokwi CI gratis habis 27 Okt 2026** setelah E01. `wokwi-cli` tidak
  bisa dipakai lagi bulan ini; E02 dan I-06 tidak bisa dijalankan. Lihat
  `HW-7.3_blockers_20261027.md`.
- E01 sudah membuktikan sisi IoT: nilai sensor, payload 71 byte, topik, QoS 0,
  retain false, dan TX sukses. Yang belum adalah efek di dashboard/AVRI/alert.
- Jangan menandai HW-7.2/7.3 selesai penuh sampai backend/FE terhubung.