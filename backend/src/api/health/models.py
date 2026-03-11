from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class ServiceStatus(str, Enum):
    healthy = "healthy"
    degraded = "degraded"
    unhealthy = "unhealthy"


class CheckResult(BaseModel):
    ok: bool
    latency_ms: float | None = None
    detail: str | None = None


class HealthStatus(BaseModel):
    model_config = {"frozen": True}  # immutable after creation

    status: ServiceStatus
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: str = Field(default="0.1.0", pattern=r"^\d+\.\d+\.\d+")
    checks: dict[str, CheckResult] | None = None
