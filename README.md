# SorryNotHired

Upload a CV, extract the text from the PDF, and send it to an OpenAI-compatible model for a deliberately mean review.

This is mostly a joke project, but the stack is real: React on the frontend, FastAPI on the backend, and a local or hosted LLM behind an OpenAI-compatible API.

## Status

Version `0.1.0`. The core flow works end to end: PDF upload, text extraction, non-CV file rejection, roast generation, and a fallback message when the backend or model server is unavailable. Deployment runs through Docker Compose with Ollama; only the frontend is exposed on the host.

Not done yet (see `ROADMAP.md`):

- rate limiting on the roast endpoint
- shareable conversations
- PDF and chat history storage for analytics
- automated tests (frontend and backend)

## Stack

| Part | Tech |
| --- | --- |
| Frontend | React 19, Vite, Bun |
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
fastapi dev src/main.py
```

The API runs at `http://localhost:8000`.

By default it talks to LM Studio at `http://127.0.0.1:1234/v1`. To use something else, export these before starting:

```bash
export API_KEY=ollama
export BASE_URL=http://localhost:11434/v1
export CHAT_MODEL=your-model-name
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

The frontend runs at `http://localhost:3000` and proxies `/api` to the backend on port `8000`.

## Docker

Copy the sample environment file first:

```bash
cp .env.example .env
```

By default the backend uses the bundled Ollama service. To use LM Studio running on the host instead, uncomment the model variables in `.env`:

```bash
API_KEY=lm_studio
BASE_URL=http://host-gateway:1234/v1
CHAT_MODEL=your-model-name
```

Then run:

```bash
docker compose up --build
```

Only the frontend is exposed on the host, on port `80`. The backend and Ollama are reachable only on the internal Docker network — nginx proxies `/api/` requests to the backend, and the backend talks to Ollama at `http://ollama:11434`.

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

Use environment values like these (the model variables default to the bundled Ollama):

```bash
DOCKER_IMAGE_BACKEND=ghcr.io/yourusername/sorrynotnhired-backend
DOCKER_IMAGE_FRONTEND=ghcr.io/yourusername/sorrynotnhired-frontend
TAG=0.1.0
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
```

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
  "roast": "Your brutally honest feedback..."
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
```

Backend:

```bash
cd backend
uv sync
fastapi dev src/main.py
```

## Project Layout

```text
sorry-not-hired/
  backend/
    src/
      api/
        chat/       PDF upload and roast endpoint
        health/     liveness endpoint
      core/         Pydantic AI agent and system prompt
      main.py       FastAPI app
  frontend/
    src/
      components/   main chat UI
  compose.yml       app, frontend, and Ollama services
  Modelfile         Ollama model definition
  init-ollama.sh    one-time Ollama model registration
```

## Security Notes

This app accepts arbitrary PDF uploads and sends extracted CV text to an LLM. Treat it as an internet-facing upload service, not just a toy, if you deploy it publicly.

Current safeguards:

- PDF-only upload check (magic bytes)
- 5 MB application-level file limit and a 6 MB nginx request size limit
- no file persistence
- same-origin only: no CORS, the frontend proxies `/api` to the backend
- model call timeout
- backend and Ollama reachable only on the internal Docker network

Things to add before a serious public deployment:

- rate limiting on `/api/v1/chat/message`
- stricter PDF validation and parser sandboxing
- monitoring for abuse and model latency
- clear privacy notice if CVs are sent to a cloud LLM

## Notes

The tone of the generated feedback is intentionally harsh. If you reuse this outside a joke/demo context, change the system prompt first.
