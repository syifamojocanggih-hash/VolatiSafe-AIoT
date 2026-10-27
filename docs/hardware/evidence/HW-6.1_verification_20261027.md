# HW-6.1 - Verifikasi topik, QoS, dan retain

Tanggal : 27 Okt 2026
Bukti live : `HW-6.1_topic_qos_retain_20261027.txt`
Serial     : `HW-6.1_serial_20261027.txt`

## Statis

`firmware/src/transport_mqtt.cpp`:

```c
snprintf(topic, sizeof(topic), "/volatisafe/v1/node/%s/telemetry", NODE_ID);
...
return mqtt.publish(topic, (const uint8_t*)payload, (unsigned int)len,
                    /*retained=*/false);
```

- Topik memakai garis miring di depan, sesuai `INTERFACES.md` 1.1.
- `publish()` tanpa argumen QoS = QoS 0.
- `retained=false`.
- Panjang topik:
  - `VS-SIM-001`: `/volatisafe/v1/node/VS-SIM-001/telemetry` = 40 karakter.
  - `VS-A1-003`: 39 karakter.
  - Keduanya < 64 (batas internal PubSubClient).
- `NODE_ID` simulasi `VS-SIM-001`, fisik `VS-A1-003` (`config.h`).

## Live

5 paket dari `scenario_i03.yaml` diterima subscriber dengan format
`%t|q=%q|r=%r|%p`:

```
/volatisafe/v1/node/VS-SIM-001/telemetry|q=0|r=0|{...}
```

Semua 5 baris menunjukkan topik persis, `q=0`, `r=0`. `ts` naik monoton
1793117087 -> 1793117147. Payload 71 byte dan sudah divalidasi di
`HW-5.4_validation_20261027.txt`.

## Batas bukti

Pengujian memakai Mosquitto lokal lewat tunnel TCP sementara karena akun Wokwi
gratis tidak punya Private Gateway. QoS 0/retain false berasal dari broker
lokal yang sama dengan target demo.