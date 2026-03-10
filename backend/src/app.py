from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from src.handlers.main import api


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup/shutdown events."""
    # Startup: Initialize connections, pools, etc.
    print("Starting up CV Roaster API...")
    yield
    # Shutdown: cleanup connections, etc.
    print("Shutting down CV Roaster API...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="SorryNotHired API",
        description="AI-powered CV roast service",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.include_router(api)

    return app
