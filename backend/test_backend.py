import json
import urllib.request
import asyncio
import websockets

BASE_URL = "http://127.0.0.1:8000/api/v1"
WS_URL = "ws://127.0.0.1:8000/ws/v1/live"

def test_endpoint(name, path, method="GET", body=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.getcode()
            result = json.loads(resp.read().decode("utf-8"))
            print(f"[PASS] {name} -> HTTP {status_code}")
            return result
    except Exception as e:
        print(f"[FAIL] {name} -> Error: {e}")
        return None

async def test_websocket():
    try:
        async with websockets.connect(WS_URL) as ws:
            # 1. Terima event CONNECTED
            init_msg = await ws.recv()
            print(f"[PASS] WebSocket Connected: {init_msg}")
            
            # 2. Test ping / pong
            await ws.send("ping")
            pong = await ws.recv()
            print(f"[PASS] WebSocket Heartbeat: {pong}")

            # 3. Test live telemetry injection & WebSocket broadcast
            req = urllib.request.Request(
                f"{BASE_URL}/simulation/inject-telemetry",
                data=json.dumps({
                    "node_id": "VS-A1-003",
                    "moisture_pct": 22.4,
                    "soil_temp_c": 31.0,
                    "ph": 7.75
                }).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req) as resp:
                assert resp.getcode() == 200
            broadcast_msg = await asyncio.wait_for(ws.recv(), timeout=3.0)
            b_data = json.loads(broadcast_msg)
            assert b_data.get("event") == "TELEMETRY_UPDATE"
            print(f"[PASS] WebSocket Broadcast Received: {b_data['event']} (Node: {b_data['data']['node_id']} | AVRI: {b_data['data']['avri_score']}%)")
    except Exception as e:
        print(f"[FAIL] WebSocket error: {e}")

def run_tests():
    print("=== Testing REST Endpoints ===")
    test_endpoint("Health Check", "/health")
    test_endpoint("List Nodes", "/nodes")
    test_endpoint("Node Telemetry 24h", "/nodes/VS-A1-003/telemetry?hours=24")
    test_endpoint("Field Current Status", "/fields/BLOK-A/current-status")
    test_endpoint("Forecast Window 72h", "/fields/BLOK-A/forecast-window?hours=72")
    
    test_endpoint(
        "Fertilizer Blend Calculator",
        "/fertilizer/blend-calculator",
        method="POST",
        body={
            "field_area_ha": 0.75,
            "crop_phase_dat": 30,
            "target_yield_ton_ha": 8.0,
            "soil_type": "clay_alkaline"
        }
    )
    
    test_endpoint(
        "Crop Cycles",
        "/crop-cycles",
        method="POST",
        body={
            "field_id": "BLOK-A",
            "planting_date": "2026-11-01",
            "seed_variety": "BISI-18",
            "field_area_ha": 0.75,
            "target_yield_ton_ha": 8.0
        }
    )
    
    res_whatif = test_endpoint(
        "Simulation What-If (Hot Dry Kritis)",
        "/simulation/what-if",
        method="POST",
        body={
            "soil_temp_c": 34.5,
            "moisture_pct": 21.0,
            "ph": 7.85,
            "rain_mm": 0.0
        }
    )
    if res_whatif:
        print("  -> What-If AVRI:", res_whatif["data"]["avri_score"], "% | Category:", res_whatif["data"]["risk_category"])
        print("  -> Action:", res_whatif["data"]["prescription"]["action_id"])
        print("  -> SHAP count:", len(res_whatif["data"]["prescription"]["shap_explanations"]))

    res_safe = test_endpoint(
        "Simulation What-If (Optimal Safe)",
        "/simulation/what-if",
        method="POST",
        body={
            "soil_temp_c": 25.0,
            "moisture_pct": 45.0,
            "ph": 6.8,
            "rain_mm": 10.0
        }
    )
    if res_safe:
        print("  -> What-If AVRI (Safe):", res_safe["data"]["avri_score"], "% | Category:", res_safe["data"]["risk_category"])
        print("  -> Action:", res_safe["data"]["prescription"]["action_id"])

    print("\n=== Testing WebSocket Live Stream ===")
    asyncio.run(test_websocket())

if __name__ == "__main__":
    run_tests()
