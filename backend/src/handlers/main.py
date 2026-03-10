import health
from fastapi import APIRouter

api = APIRouter(prefix="/api/v1/")

api.include_router(health.router)
