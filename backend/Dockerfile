FROM python:3.14

COPY --from=ghcr.io/astral-sh/uv:0.9.29 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1

ENV UV_LINK_MODE=copy

WORKDIR /app/

ENV PATH="/app/.venv/bin:$PATH"

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-workspace --package app

COPY ./backend/src /app/backend/src

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --package backend

WORKDIR /app/backend/

CMD ["fastapi", "run", "src/main.py"]
