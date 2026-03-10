from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from src.services import health

router = APIRouter(prefix="/health")


@router.get("/liveness")
async def liveness():
    """Liveness probe - checks if the application is running."""
    result = await health.liveness()
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=result,
    )


@router.get("/readiness")
async def readiness():
    """Readiness probe - checks if the application is ready to serve traffic."""
    result = await health.readiness()

    if result["status"] == "ready":
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=result,
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=result,
        )
