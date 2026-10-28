from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "VolatiSafe AIoT Backend"
    VERSION: str = "v1.0"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Database (TimescaleDB / Postgres or Fallback SQLite)
    POSTGRES_SERVER: str = "timescaledb"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "volatisafe"
    POSTGRES_PASSWORD: str = "volatisafe_secret"
    POSTGRES_DB: str = "volatisafe_db"
    DATABASE_URL: str = "postgresql+psycopg://volatisafe:volatisafe_secret@timescaledb:5432/volatisafe_db"
    
    # MQTT
    MQTT_BROKER_HOST: str = "mosquitto"
    MQTT_BROKER_PORT: int = 1883
    MQTT_TELEMETRY_TOPIC: str = "/volatisafe/v1/node/+/telemetry"
    
    # AI Engine & Digital Twin
    MOCK_AI_PREDICTOR: bool = True
    
    # Alerts Gateway
    WHATSAPP_API_URL: str = "https://api.fonnte.com/send"
    WHATSAPP_TOKEN: str = "MOCK_TOKEN"
    TELEGRAM_BOT_TOKEN: str = "MOCK_BOT_TOKEN"
    TELEGRAM_CHAT_ID: str = "@VolatiSafeAlertBot"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
