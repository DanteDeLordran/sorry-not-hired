import time

import httpx
from fastapi import APIRouter

from api.health.models import CheckResult, HealthStatus, ServiceStatus
from config import get_env_vars

router = APIRouter(prefix="/health")


@router.get("/liveness")
async def liveness() -> HealthStatus:
    """Liveness probe - checks if the application is running."""
    return HealthStatus(
        status=ServiceStatus.healthy,
        checks={"app": CheckResult(ok=True)},
    )


@router.get("/readiness")
async def readiness() -> HealthStatus:
    """Readiness probe - checks if the application is ready to serve traffic."""
    checks: dict[str, CheckResult] = {}

    # Check if app is ready
    checks["app"] = CheckResult(ok=True)

    # Check LM Studio connectivity
    env = get_env_vars()
    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{env.BASE_URL}/models")
            latency_ms = (time.perf_counter() - start) * 1000
            if response.status_code == 200:
                checks["lmstudio"] = CheckResult(ok=True, latency_ms=latency_ms)
            else:
                checks["lmstudio"] = CheckResult(
                    ok=False,
                    latency_ms=latency_ms,
                    detail=f"Status code: {response.status_code}",
                )
    except Exception as e:
        checks["lmstudio"] = CheckResult(ok=False, detail=str(e))

    all_healthy = all(result.ok for result in checks.values())

    return HealthStatus(
        status=ServiceStatus.healthy if all_healthy else ServiceStatus.unhealthy,
        checks=checks,
    )
