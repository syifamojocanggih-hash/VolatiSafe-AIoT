from datetime import datetime, timezone
from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")

class MetaDTO(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    version: str = "v1.0"

class ResponseEnvelope(BaseModel, Generic[T]):
    data: T
    meta: MetaDTO = Field(default_factory=MetaDTO)

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None

class ErrorEnvelope(BaseModel):
    error: ErrorDetail

def create_envelope(data: Any, version: str = "v1.0") -> dict:
    return {
        "data": data,
        "meta": {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "version": version
        }
    }
