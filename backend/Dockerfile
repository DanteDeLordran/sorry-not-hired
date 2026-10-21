FROM python:3.14-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.9.29 /uv /uvx /bin/

WORKDIR /app/

# The workspace manifest must exist before uv resolves the backend package.
COPY pyproject.toml uv.lock /app/
COPY backend/pyproject.toml /app/backend/pyproject.toml

# Install dependencies only (cached layer)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-workspace --no-dev --package backend

COPY ./backend/src /app/backend/src
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --no-create-home app

USER 10001:10001
WORKDIR /app/backend/
# Parsing runs in bounded child processes; one async worker owns the admission limits.
CMD ["uvicorn", "main:app", "--app-dir", "src", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-proxy-headers"]
