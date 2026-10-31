import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import paho.mqtt.client as mqtt

from app.core.config import settings
from app.routers import health, nodes, fields, agronomy, simulation, websocket, reports

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("volatisafe.main")

def start_mqtt_worker():
    def on_connect(client, userdata, flags, rc, properties=None):
        logger.info(f"Connected to MQTT broker ({settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}) with result code {rc}")
        client.subscribe(settings.MQTT_TELEMETRY_TOPIC)
        logger.info(f"Subscribed to telemetry topic: {settings.MQTT_TELEMETRY_TOPIC}")

    def on_message(client, userdata, msg):
        try:
            raw_text = msg.payload.decode("utf-8")
            payload = json.loads(raw_text)
            logger.info(f"Received LoRa telemetry payload on {msg.topic}: {payload}")
            from app.services.ingestion import IngestionService
            res = IngestionService.process_lora_payload(payload)
            if res:
                from app.routers.websocket import ws_manager
                t_data = res.get("telemetry", {})
                p_data = res.get("prediction", {})
                ws_payload = {
                    "node_id": res.get("node_id"),
                    "field_id": res.get("field_id", "BLOK-A"),
                    "timestamp": t_data.get("timestamp"),
                    "moisture_pct": t_data.get("moisture_pct"),
                    "soil_temp_c": t_data.get("soil_temp_c"),
                    "ph": t_data.get("ph"),
                    "avri_score": p_data.get("avri_score"),
                    "risk_category": p_data.get("risk_category"),
                    "is_predicted": t_data.get("is_predicted", False),
                    "telemetry": t_data,
                    "prediction": p_data,
                    "alert": res.get("alert")
                }
                # Broadcast TELEMETRY_UPDATE via thread-safe scheduler
                ws_manager.broadcast_threadsafe({
                    "event": "TELEMETRY_UPDATE",
                    "data": ws_payload
                })

                if res.get("alert"):
                    ws_manager.broadcast_threadsafe({
                        "event": "ALERT_TRIGGERED",
                        "data": res.get("alert")
                    })
        except Exception as e:
            logger.error(f"Error parsing MQTT message: {e}")

    try:
        client = mqtt.Client(
            client_id="volatisafe_central_orchestrator",
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2
        )
        client.on_connect = on_connect
        client.on_message = on_message
        client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
        client.loop_start()
        logger.info("Background MQTT consumer thread started successfully.")
        return client
    except Exception as e:
        logger.warning(f"Could not connect to MQTT broker ({e}). MQTT telemetry consumer disabled.")
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VolatiSafe AIoT Central Backend...")
    logger.info("Registered routes: /api/v1/*, /ws/v1/live")
    import asyncio
    from app.routers.websocket import ws_manager
    main_loop = asyncio.get_running_loop()
    ws_manager.set_loop(main_loop)
    mqtt_client = start_mqtt_worker()
    yield
    logger.info("Shutting down VolatiSafe AIoT Central Backend...")
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Central Orchestrator, Ingestion Pipeline, and API for VolatiSafe AIoT",
    lifespan=lifespan
)

# CORS Middleware (Frontend Next.js connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Error Envelope Handlers (INTERFACES.md §0.2)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        code = detail.get("code", "HTTP_ERROR")
        message = detail.get("message", "An error occurred")
        details = detail.get("details", None)
    else:
        code = "HTTP_ERROR"
        message = str(detail)
        details = None

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_err = errors[0] if errors else {}
    field_loc = " -> ".join([str(loc) for loc in first_err.get("loc", [])])
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": f"Input validation failed on {field_loc}: {first_err.get('msg', 'Invalid input')}",
                "details": {
                    "errors": errors
                }
            }
        }
    )

# Include REST Routers under /api/v1
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(nodes.router, prefix=settings.API_V1_STR)
app.include_router(fields.router, prefix=settings.API_V1_STR)
app.include_router(agronomy.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

# Include WebSocket Router
app.include_router(websocket.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
