import json
import logging
import asyncio
from typing import List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

logger = logging.getLogger("volatisafe.websocket")

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    """
    Mengelola koneksi aktif WebSocket untuk siaran telemetri real-time
    (WEBSOCKET_AND_ALERTS.md §1 & INTERFACES.md §3.3).
    Mendukung broadcast asinkron dan thread-safe dari background thread (seperti MQTT consumer).
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.main_loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.main_loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict):
        text_data = json.dumps(message)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(text_data)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)

    def broadcast_threadsafe(self, message: dict):
        """
        Menjadwalkan broadcast secara aman dari worker/background thread
        ke FastAPI main event loop tanpa konflik loop concurrency.
        """
        if self.main_loop and self.main_loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast(message), self.main_loop)
        else:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(self.broadcast(message))
            except Exception as e:
                logger.warning(f"Could not broadcast message threadsafe: {e}")

ws_manager = ConnectionManager()

@router.websocket("/ws/v1/live")
async def websocket_live_stream(
    websocket: WebSocket,
    client_id: Optional[str] = Query(None, description="ID Klien PWA/Web")
):
    await ws_manager.connect(websocket)
    try:
        # Kirim salam pembuka status koneksi (INTERFACES.md §3.3)
        await websocket.send_json({
            "event": "CONNECTED",
            "message": "Connected to VolatiSafe AIoT live stream",
            "client_id": client_id or "anonymous"
        })
        while True:
            data = await websocket.receive_text()
            # Handle heartbeat ping/pong
            if data.strip().lower() == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    parsed = json.loads(data)
                    # Jika klien mengirimkan simulasi pesan echo
                    if parsed.get("action") == "echo":
                        await websocket.send_json({"event": "ECHO", "payload": parsed})
                except json.JSONDecodeError:
                    pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

