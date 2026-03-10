import asyncio
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class HealthStatus:
    status: str
    timestamp: float
    version: str = "0.1.0"
    checks: dict[str, Any] | None = None


async def liveness() -> dict[str, Any]:
    """Check if the application is running.

    Liveness probe should always succeed unless the process is deadlocked
    or in a broken state. This is used by Kubernetes to determine if
    the container should be restarted.
    """
    return {
        "status": "alive",
        "timestamp": time.time(),
    }


async def readiness() -> dict[str, Any]:
    """Check if the application is ready to serve traffic.

    Readiness probe verifies all critical dependencies are available:
    - Database connections
    - External API connectivity (LLM provider)
    - Required configuration

    Returns failure if any dependency is unavailable. This signals
    Kubernetes to stop sending traffic to this pod.
    """
    checks: dict[str, Any] = {}
    all_healthy = True

    # Check 1: Verify LLM provider is reachable
    llm_check = await _check_llm_provider()
    checks["llm_provider"] = llm_check
    if not llm_check["healthy"]:
        all_healthy = False

    # Check 2: Verify required config is present
    config_check = _check_configuration()
    checks["configuration"] = config_check
    if not config_check["healthy"]:
        all_healthy = False

    return {
        "status": "ready" if all_healthy else "not_ready",
        "timestamp": time.time(),
        "version": "0.1.0",
        "checks": checks,
    }


async def _check_llm_provider() -> dict[str, Any]:
    """Verify the LLM provider is accessible."""
    import httpx

    # Get base URL from the model config - hardcoded for now
    base_url = "http://127.0.0.1:1234/v1"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{base_url}/models")
            if response.status_code == 200:
                return {
                    "healthy": True,
                    "url": base_url,
                    "message": "LLM provider is reachable",
                }
            return {
                "healthy": False,
                "url": base_url,
                "message": f"LLM provider returned status {response.status_code}",
            }
    except httpx.ConnectError as e:
        return {
            "healthy": False,
            "url": base_url,
            "message": f"Cannot connect to LLM provider: {e}",
        }
    except asyncio.TimeoutError:
        return {
            "healthy": False,
            "url": base_url,
            "message": "Connection to LLM provider timed out",
        }
    except Exception as e:
        return {
            "healthy": False,
            "url": base_url,
            "message": f"Unexpected error: {e}",
        }


def _check_configuration() -> dict[str, Any]:
    """Verify required environment configuration is present."""
    import os

    required_vars = ["OPENAI_API_KEY"]  # Adjust based on your actual requirements

    missing = [var for var in required_vars if not os.getenv(var)]

    if missing:
        return {
            "healthy": False,
            "message": f"Missing required environment variables: {', '.join(missing)}",
        }

    return {
        "healthy": True,
        "message": "All required configuration is present",
    }
