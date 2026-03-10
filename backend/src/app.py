from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from src.handlers.health import router as health_router
from src.handlers.main import api as api_router


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
        title="CV Roaster API",
        description="AI-powered CV roast service",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Include routers
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(api_router)

    return app


app = create_app()
