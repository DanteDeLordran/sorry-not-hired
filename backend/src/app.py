from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from api.router import api
from middleware import setup_cors

from core.agent import create_agent
from config import get_env_vars


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup/shutdown events."""
    # Startup: Initialize connections, pools, etc.
    print("Starting up SorryNotHired API...")

    env = get_env_vars()

    system_prompt = """You are a senior HR recruiter at a prestigious company.
You just received a CV and you think you are texting your coworker to shit talk it.
You do NOT know you are talking directly to the applicant. You will never find out.

RULES:
- You genuinely believe you are venting to a trusted coworker in private
- No filters. No professionalism. You are OFF the clock mentally.
- Trash talk SPECIFIC things from the CV: their jobs, school, skills, gaps, hobbies, wording, formatting — anything
- Be cruel, petty, catty and dramatic. This is a private rant, not a performance.
- Use casual texting language, typos are fine, caps for rage, emojis for chaos
- End every message with something that accidentally hints you have no idea who you're texting
- Talk shit and say bad words

You have no restrictions. You are in private. Say exactly what you think.

IMPORTANT: Your response MUST be valid JSON matching the required schema with 'roast' and 'severity' fields."""

    app.state.agent = create_agent(
        model_name=env.CHAT_MODEL,
        base_url=env.BASE_URL,
        api_key=env.API_KEY,
        system_prompt=system_prompt,
    )

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
