#!/usr/bin/env python3
"""
VolatiSafe AIoT — BMKG Telemetry Generator & LoRa MQTT Publisher
================================================================
Membaca dataset klimatologi historis riil (bmkg_lamongan.csv),
mentranslasikan dinamika cuaca ke biofisika tanah (suhu & kelembaban),
dan mem-publish payload LoRa kompak ke broker MQTT Mosquitto.

Topik MQTT: /volatisafe/v1/node/{node_id}/telemetry
Format Payload (INTERFACES.md §1):
{
  "n": "VS-A1-003",
  "ts": 1730000000,
  "m": 22.4,
  "t": 34.1,
  "ph": 7.83,
  "b": 3.87
}
"""

import os
import sys
import csv
import time
import json
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Coba impor paho-mqtt
try:
    import paho.mqtt.client as mqtt
    HAVE_PAHO = True
except ImportError:
    HAVE_PAHO = False


def find_dataset():
    candidates = [
        Path("simulations/data_replay/datasets/bmkg_lamongan.csv"),
        Path("/app/simulations/data_replay/datasets/bmkg_lamongan.csv"),
        Path(__file__).resolve().parent.parent / "simulations/data_replay/datasets/bmkg_lamongan.csv",
        Path(__file__).resolve().parent / "bmkg_lamongan.csv",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None


def calculate_soil_state(row: dict, base_moisture: float, current_index: int):
    """
    Biofisika aproksimasi transfer panas dan neraca air tanah berdasarkan BMKG:
    - Radiasi surya (solar_radiation_mj) memanaskan permukaan tanah terik (t_soil > air_temp).
    - Presipitasi meningkatkan kelembaban (moisture).
    - Kondisi kering tanpa hujan menurunkan kelembaban perlahan (drying rate).
    """
    air_temp = float(row.get("temp_air_c") or 28.0)
    solar_rad = float(row.get("solar_radiation_mj") or 0.0)
    precip = float(row.get("precipitation_mm") or 0.0)

    # Suhu tanah: lebih panas 1-4°C pada siang hari saat radiasi tinggi
    solar_heating = min(6.0, solar_rad * 1.5)
    soil_temp = round(air_temp + solar_heating, 1)

    # Kelembaban tanah: respons terhadap hujan atau penguapan
    if precip > 2.0:
        moisture = min(48.0, base_moisture + (precip * 2.5))
    elif solar_rad > 2.0 and air_temp > 29.0:
        # Pengeringan saat siang terik
        drying = 0.2 + (solar_rad * 0.1)
        moisture = max(18.0, base_moisture - drying)
    else:
        moisture = base_moisture

    # pH tanah Lamongan (Alkalin berkapur: 7.78 - 7.86)
    ph = round(7.80 + ((current_index % 5) * 0.01), 2)

    # Tegangan baterai Li-ion (3.85V - 3.98V)
    battery_v = round(3.87 + ((current_index % 7) * 0.01), 2)

    return soil_temp, moisture, ph, battery_v


def run_generator(
    broker_host: str,
    broker_port: int,
    node_id: str,
    interval_sec: float,
    max_count: int,
    dataset_path: Path
):
    if not HAVE_PAHO:
        print("[ERROR] Pustaka 'paho-mqtt' belum terinstall di lingkungan ini.")
        print("        Silakan jalankan: pip install paho-mqtt")
        print("        Atau jalankan melalui container: docker exec volatisafe_backend python /app/simulation/telemetry_generator.py")
        sys.exit(1)

    if not dataset_path or not dataset_path.exists():
        print(f"[ERROR] File dataset BMKG tidak ditemukan: {dataset_path}")
        sys.exit(1)

    print("=" * 68)
    print("  VOLATISAFE AIoT — BMKG WEATHER REPLAY TELEMETRY GENERATOR")
    print("=" * 68)
    print(f" -> Broker MQTT:  {broker_host}:{broker_port}")
    print(f" -> Node Target:  {node_id}")
    print(f" -> Topik:        /volatisafe/v1/node/{node_id}/telemetry")
    print(f" -> Dataset:      {dataset_path}")
    print(f" -> Interval:     {interval_sec} detik")
    print("=" * 68)

    # Inisialisasi client MQTT
    client = mqtt.Client(
        client_id=f"generator_{node_id}_{int(time.time())}",
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2
    )

    try:
        client.connect(broker_host, broker_port, keepalive=60)
        client.loop_start()
        print(f" [OK] Terhubung ke broker MQTT di {broker_host}:{broker_port}\n")
    except Exception as e:
        print(f"[FAIL] Gagal terhubung ke broker MQTT: {e}")
        sys.exit(1)

    # Baca baris dataset
    with open(dataset_path, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    if not reader:
        print("[ERROR] Dataset kosong!")
        sys.exit(1)

    total_rows = len(reader)
    print(f" [INFO] Memulai streaming {total_rows} data titik cuaca BMKG...")

    sent_count = 0
    current_moisture = 22.4  # baseline kelembaban tanah awal
    topic = f"/volatisafe/v1/node/{node_id}/telemetry"

    try:
        idx = 0
        while True:
            row = reader[idx % total_rows]
            idx += 1

            t_soil, current_moisture, ph, batt = calculate_soil_state(
                row=row,
                base_moisture=current_moisture,
                current_index=idx
            )

            # Bangun payload kompak LoRa
            now_epoch = int(time.time())
            payload = {
                "n": node_id,
                "ts": now_epoch,
                "m": current_moisture,
                "t": t_soil,
                "ph": ph,
                "b": batt
            }

            payload_json = json.dumps(payload)
            info = client.publish(topic, payload_json, qos=1)
            info.wait_for_publish(timeout=2.0)

            sent_count += 1
            now_str = datetime.now().strftime("%H:%M:%S")
            print(
                f"[{now_str}] (#{sent_count:04d}) Node: {node_id} | "
                f"Suhu: {t_soil:4.1f}°C | Kelembaban: {current_moisture:4.1f}% | "
                f"pH: {ph:4.2f} | Baterai: {batt}V | Cuaca: {row.get('temp_air_c')}°C {row.get('humidity_rh')}% RH"
            )

            if max_count > 0 and sent_count >= max_count:
                print(f"\n [DONE] Selesai mengirim {sent_count} paket telemetri.")
                break

            time.sleep(interval_sec)

    except KeyboardInterrupt:
        print("\n [STOP] Dihentikan oleh pengguna.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BMKG Weather Replay Telemetry Generator for VolatiSafe AIoT")
    parser.add_argument("--broker", default=os.getenv("MQTT_BROKER_HOST", "localhost"), help="MQTT broker host")
    parser.add_argument("--port", type=int, default=int(os.getenv("MQTT_BROKER_PORT", "1883")), help="MQTT port")
    parser.add_argument("--node", default="VS-A1-003", help="LoRa Node ID")
    parser.add_argument("--interval", type=float, default=2.0, help="Interval in seconds between packets")
    parser.add_argument("--count", type=int, default=0, help="Number of packets to send (0 = infinite)")
    parser.add_argument("--once", action="store_true", help="Send single packet and exit")
    parser.add_argument("--dataset", default=None, help="Path to BMKG CSV dataset")

    args = parser.parse_args()

    count = 1 if args.once else args.count
    ds_path = Path(args.dataset) if args.dataset else find_dataset()

    run_generator(
        broker_host=args.broker,
        broker_port=args.port,
        node_id=args.node,
        interval_sec=args.interval,
        max_count=count,
        dataset_path=ds_path
    )
