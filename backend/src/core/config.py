from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    base_url: str = "http://127.0.0.1:1234/v1"
    api_key: str = "lm_studio"
    chat_model: str = "qwen3.5-2b-uncensored-hauhaucs-aggressive"
    max_output_tokens: int = Field(default=2048, ge=1, le=32768)
    agent_timeout_seconds: float = Field(default=120, gt=0)
    llm_read_timeout_seconds: float = Field(default=30, gt=0)
    llm_max_retries: int = Field(default=0, ge=0, le=2)
    max_concurrent_roasts: int = Field(default=4, ge=1, le=32)
    max_pdf_jobs: int = Field(default=2, ge=1, le=8)
    max_pdf_pages: int = Field(default=20, ge=1, le=200)
    max_cv_chars: int = Field(default=100_000, ge=200, le=1_000_000)
    pdf_timeout_seconds: float = Field(default=15, gt=0, le=120)
    pdf_memory_mb: int = Field(default=512, ge=128, le=2048)


settings = Settings()
