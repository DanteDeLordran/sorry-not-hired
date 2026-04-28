import os

from pydantic import BaseModel


class EnvVars(BaseModel):
    API_KEY: str
    CHAT_MODEL: str
    BASE_URL: str


def get_env_vars() -> EnvVars:
    return EnvVars(
        BASE_URL=os.getenv("BASE_URL", "http://127.0.0.1:1234/v1"),
        CHAT_MODEL=os.getenv("CHAT_MODEL", "qwen3.5-2b-uncensored-hauhaucs-aggressive"),
        API_KEY=os.getenv("API_KEY", "lm_studio"),
    )
