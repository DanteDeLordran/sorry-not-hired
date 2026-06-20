# SorryNotHired

Upload a CV, extract the text from the PDF, and send it to an OpenAI-compatible model for a deliberately mean review.

This is mostly a joke project, but the stack is real: React on the frontend, FastAPI on the backend, and a local or hosted LLM behind an OpenAI-compatible API.

## Stack

| Part | Tech |
| --- | --- |
| Frontend | React 19, TanStack Router, Tailwind CSS v4, Bun |
| Backend | FastAPI, Pydantic AI, pymupdf4llm, uv |
| Model API | LM Studio, Ollama, vLLM, OpenAI, or anything OpenAI-compatible |
| Deployment | Docker Compose, Nginx, optional Coolify |

## How It Works

1. The frontend sends a PDF as `multipart/form-data`.
2. The backend checks the upload and extracts Markdown from the PDF.
3. The extracted CV text is sent to the configured LLM.
4. The model response is returned as JSON and displayed as chat bubbles.

There is no database and no user account system. Uploaded files are processed in memory and are not stored by the app.

## Requirements

- Python 3.13+
- [uv](https://docs.astral.sh/uv/)
- [Bun](https://bun.sh/)
- An OpenAI-compatible model endpoint
- Docker, if you want to use the compose setup

## Local Development

### Backend

```bash
cd backend
uv sync
cp ../.env.example .env
fastapi dev src/app.py
```

The API runs at `http://localhost:8000`.

Set these values in `.env`:

```bash
API_KEY=your-api-key
BASE_URL=http://localhost:1234/v1
CHAT_MODEL=your-model-name
```

For LM Studio, `BASE_URL` is usually `http://localhost:1234/v1`.

For Ollama, it is usually `http://localhost:11434/v1`.

### Frontend

```bash
cd frontend
bun install
bun run dev
```

The frontend runs at `http://localhost:3000`.

If the backend is not on the same origin, set:

```bash
VITE_BASE_URL=http://localhost:8000/api/v1
```

## Docker

Copy the sample environment file first:

```bash
cp .env.example .env
```

For a local LM Studio server running on the host machine, use:

```bash
API_KEY=lm_studio
BASE_URL=http://host-gateway:1234/v1
CHAT_MODEL=your-model-name
DOCKER_IMAGE_BACKEND=sorry-not-hired-backend
DOCKER_IMAGE_FRONTEND=sorry-not-hired-frontend
TAG=latest
VITE_BASE_URL=/api/v1
```

Then run:

```bash
docker compose up --build
```

The frontend is exposed on port `80`. The backend is exposed on port `8000` by the current compose file.

## Ollama Deployment

The compose setup can run Ollama with a GGUF model mounted from the host. The model is not stored in this repository.

On the server, download the model once:

```bash
mkdir -p /data/sorrynotnhired/models
cd /data/sorrynotnhired/models

pip install huggingface_hub
huggingface-cli download \
  HauhauCS/Qwen3.5-2B-Uncensored-GGUF \
  Qwen3.5-2B-Uncensored-HauhauCS-Aggressive-Q8_0.gguf \
  --local-dir .
```

Use environment values like these:

```bash
API_KEY=ollama
BASE_URL=http://ollama:11434/v1
CHAT_MODEL=qwen3.5-uncensored
DOCKER_IMAGE_BACKEND=ghcr.io/yourusername/sorrynotnhired-backend
DOCKER_IMAGE_FRONTEND=ghcr.io/yourusername/sorrynotnhired-frontend
TAG=0.1.0
VITE_BASE_URL=https://yourdomain.com/api/v1
```

Start it with:

```bash
docker compose up -d
```

On first boot, `ollama-init` registers the mounted model into the Ollama volume. Later deploys reuse that volume.

## API

Base path: `/api/v1`

### Health

```http
GET /api/v1/health/liveness
GET /api/v1/health/readiness
```

`readiness` checks whether the configured model endpoint is reachable.

### Roast A CV

```http
POST /api/v1/chat/message
Content-Type: multipart/form-data
```

Form field:

```text
file=<PDF file>
```

Example response:

```json
{
  "roast": "Your brutally honest feedback...",
  "severity": "medium",
  "filename": "resume.pdf"
}
```

Expected error cases include non-PDF uploads, oversized files, unreadable PDFs, files that do not look like CVs, and unavailable model backends.

## Scripts

Frontend:

```bash
cd frontend
bun run dev
bun run build
bun run lint
bun run format
bun run test
```

Backend:

```bash
cd backend
uv sync
fastapi dev src/app.py
```

The backend README lists additional linting and type-checking commands, but tests are not wired up yet.

## Project Layout

```text
sorry-not-hired/
  backend/
    src/
      api/
        chat/       PDF upload and roast endpoint
        health/     liveness and readiness endpoints
      core/         Pydantic AI agent setup
      app.py        FastAPI app factory
      config.py     environment config
      middleware.py CORS setup
  frontend/
    src/
      components/   main chat UI
      models/       TypeScript response types
      routes/       TanStack routes
  compose.yml       app, frontend, and Ollama services
  Modelfile         Ollama model definition
  init-ollama.sh    one-time Ollama model registration
```

## Security Notes

This app accepts arbitrary PDF uploads and sends extracted CV text to an LLM. Treat it as an internet-facing upload service, not just a toy, if you deploy it publicly.

Current safeguards:

- PDF-only upload checks
- 5 MB application-level file limit
- no file persistence
- CORS limited to local frontend origins in the backend
- model call timeout

Things to add before a serious public deployment:

- rate limiting on `/api/v1/chat/message`
- reverse-proxy request size limits
- stricter PDF validation and parser sandboxing
- monitoring for abuse and model latency
- clear privacy notice if CVs are sent to a cloud LLM
- firewall rules so Ollama and the backend are not exposed directly unless intended

## Notes

The tone of the generated feedback is intentionally harsh. If you reuse this outside a joke/demo context, change the system prompt first.
