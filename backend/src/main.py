from fastapi import FastAPI

from api.router import api

app = FastAPI(
    title="SorryNotHired API",
    description="CV roasting as a service",
    version="0.1.0",
)

app.include_router(api)
