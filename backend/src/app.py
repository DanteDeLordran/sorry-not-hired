from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from api.router import api
from middleware import setup_cors


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup/shutdown events."""
    # Startup: Initialize connections, pools, etc.
    print("Starting up SorryNotHired API...")
    yield
    # Shutdown: cleanup connections, etc.
    print("Shutting down SorryNotHired API...")


def create_app() -> FastAPI:
    app = FastAPI(
        title="SorryNotHired API",
        description="CV roasting as a service",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Setup middleware
    setup_cors(app)

    app.include_router(api)

    return app
