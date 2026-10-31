"""Validator payload lokal — meniru gate backend, bukan menggantikannya.

Jalankan: python simulation/wokwi/validate_payload.py '<json>'
Atau:     python simulation/wokwi/validate_payload.py --file payload.txt

Batas diambil dari docs/universal/INTERFACES.md 1.3, bukan dari tebakan.
Validator ini menolak paket yang sama dengan yang ditolak backend, jadi
kegagalan bisa dibedakan: payload salah vs backend salah.
"""

import json
import sys

REQUIRED = {"n", "ts", "m", "t", "ph", "b"}

# (min, max, jumlah desimal maksimum sesuai kontrak)
BOUNDS = {
    "m": (0.0, 100.0, 1),
    "t": (-10.0, 60.0, 1),
    "ph": (3.0, 10.0, 2),
    "b": (2.80, 4.25, 2),
}

TS_MIN = 1_700_000_000


def _decimals(value: float) -> int:
    text = repr(float(value))
    if "e" in text or "E" in text:
        return 99
    if "." not in text:
        return 0
    return len(text.split(".", 1)[1].rstrip("0"))


def validate(raw: str) -> list[str]:
    errors: list[str] = []

    try:
        obj = json.loads(raw)
    except json.JSONDecodeError as exc:
        return [f"JSON tidak valid: {exc}"]

    if not isinstance(obj, dict):
        return ["payload harus objek JSON"]

    missing = REQUIRED - obj.keys()
    if missing:
        errors.append(f"key kurang: {sorted(missing)}")
    extra = obj.keys() - REQUIRED
    if extra:
        errors.append(f"key ekstra (menyimpang dari kontrak): {sorted(extra)}")

    node_id = obj.get("n")
    if not isinstance(node_id, str):
        errors.append("n harus string")
    elif not 6 <= len(node_id) <= 12:
        errors.append(f"n panjang {len(node_id)}, harus 6-12")
    elif " " in node_id:
        errors.append("n tidak boleh mengandung spasi")

    ts = obj.get("ts")
    if isinstance(ts, bool) or not isinstance(ts, int):
        errors.append("ts harus integer")
    elif ts < TS_MIN:
        errors.append(f"ts {ts} < {TS_MIN} (jam belum sinkron?)")

    for key, (lo, hi, max_dec) in BOUNDS.items():
        value = obj.get(key)
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            errors.append(f"{key} harus angka, bukan {type(value).__name__}")
            continue
        if not lo <= value <= hi:
            errors.append(f"{key}={value} di luar batas {lo}..{hi}")
            continue
        if _decimals(value) > max_dec:
            errors.append(f"{key}={value} lebih dari {max_dec} desimal")

    return errors


def main() -> int:
    if len(sys.argv) < 2:
        print("pemakaian: validate_payload.py '<json>' | --file <path>")
        return 2

    if sys.argv[1] == "--file":
        if len(sys.argv) < 3:
            print("pemakaian: validate_payload.py --file <path>")
            return 2
        raw = open(sys.argv[2], encoding="utf-8").read().strip()
    else:
        raw = sys.argv[1].strip()

    errors = validate(raw)
    if errors:
        print(f"[DITOLAK] {len(errors)} masalah:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print(f"[OK] payload valid, {len(raw)} byte")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
