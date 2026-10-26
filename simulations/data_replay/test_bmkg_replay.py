"""
Unit Test untuk Modul Replay Cuaca BMKG Lamongan (DT-1.1)
"""

import os
import pytest
from simulations.data_replay.bmkg_replay import BMKGWeatherReplayStreamer, WeatherRecord

CSV_PATH = "simulations/data_replay/datasets/bmkg_lamongan.csv"


def test_bmkg_replay_file_exists():
    assert os.path.exists(CSV_PATH), f"File {CSV_PATH} wajib ada."


def test_bmkg_replay_provenance_metadata():
    streamer = BMKGWeatherReplayStreamer(CSV_PATH)
    meta = streamer.get_provenance_metadata()
    assert meta["station_wmo_id"] == "96933"
    assert meta["total_records"] == 8760
    assert len(meta["sha256_checksum"]) == 64
    assert meta["is_verified"] is True


def test_bmkg_replay_stream_records():
    streamer = BMKGWeatherReplayStreamer(CSV_PATH, speed_multiplier=1000.0)
    records = list(streamer.stream_records(max_records=10, apply_sleep=False))
    assert len(records) == 10
    first = records[0]
    assert isinstance(first, WeatherRecord)
    assert first.timestamp.startswith("2025-01-01")
    assert 15.0 <= first.temp_air_c <= 45.0
    assert 0.0 <= first.humidity_rh <= 100.0
