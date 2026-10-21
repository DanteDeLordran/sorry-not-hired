import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from api.router import api
from core.config import settings
from core.llm import create_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    app.state.roast_slots = asyncio.Semaphore(settings.max_concurrent_roasts)
    app.state.pdf_slots = asyncio.Semaphore(settings.max_pdf_jobs)
    async with create_client() as client:
        app.state.llm = client
        yield


app = FastAPI(
    title="SorryNotHired API",
    description="CV roasting as a service",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(api)
