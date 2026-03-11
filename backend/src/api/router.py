from fastapi import APIRouter

from api.chat import router as chat_router
from api.health import router as health_router

api = APIRouter(prefix="/api/v1")

api.include_router(chat_router.router)
api.include_router(health_router.router)
