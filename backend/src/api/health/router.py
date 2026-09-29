from fastapi import APIRouter

router = APIRouter(prefix="/health")


@router.get("/liveness")
async def liveness() -> dict[str, str]:
    return {"status": "ok"}
