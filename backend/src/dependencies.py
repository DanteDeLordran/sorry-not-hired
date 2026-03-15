from fastapi import Request
from pydantic_ai import Agent
from api.chat.models import RoastOutput


def get_agent(request: Request) -> Agent[None, RoastOutput]:
    return request.app.state.agent
