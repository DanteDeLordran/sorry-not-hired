FROM python:3.14

COPY --from=ghcr.io/astral-sh/uv:0.9.29 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app/

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies with cache
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

# Copy source code
COPY ./backend/src /app/backend/src

WORKDIR /app/backend/

# Expose default FastAPI port
EXPOSE 8000

# Health check using the readiness endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import httpx; r = httpx.get('http://localhost:8000/api/v1/health/readiness', timeout=5); exit(0 if r.status_code == 200 else 1)" || exit 1

CMD ["fastapi", "run", "src/app.py", "--port", "8000", "--host", "0.0.0.0"]
