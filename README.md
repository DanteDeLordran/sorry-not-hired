# SorryNotHired 🤖📄

> AI-powered CV roast service. Upload your resume and get brutally honest feedback.

**Status:** 🚧 In Development | **Version:** 0.4.0

---

## 🎯 What It Does

SorryNotHired uses AI to analyze your CV and deliver a no-holds-barred critique. No corporate speak, no sugar-coating—just honest (and entertaining) feedback about your resume, disguised as an HR recruiter venting to a coworker.

**Features:**
- 📤 PDF upload with instant text extraction (pymupdf4llm)
- 🤖 AI-powered roast generation (Pydantic AI + OpenAI-compatible models)
- 💬 Chat-style UI with typing indicators and message streaming
- 🎨 Modern, responsive phone-themed UI
- 🔒 Local LLM support (LM Studio, Ollama) or cloud providers

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│   LLM API   │
│  (React +   │     │   (FastAPI)  │     │  (OpenAI-   │
│  TanStack)  │◀────│  + Pydantic  │     │  compatible)│
└─────────────┘     └──────────────┘     └─────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TanStack Router, Tailwind CSS v4, Bun |
| **Backend** | Python 3.13+, FastAPI, Pydantic AI, pymupdf4llm, uv |
| **LLM** | OpenAI-compatible API (LM Studio, Ollama, vLLM, OpenAI) |
| **Infrastructure** | Docker, Docker Compose, Coolify |
| **Tooling** | Biome (lint/format), Vitest (testing), Ruff (backend lint) |

---

## 🚀 Quick Start

### Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Bun](https://bun.sh/) (JavaScript runtime)
- Docker & Docker Compose (optional, for containerized deployment)

### Development Setup

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd sorry-not-hired
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Copy environment file
cp ../.env.example .env

# Edit .env with your LLM API credentials
# API_KEY=your-key-here
# BASE_URL=http://localhost:1234/v1
# CHAT_MODEL=your-model-name

# Run development server
fastapi dev src/app.py
```

Backend runs on: `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
bun install

# Run development server
bun run dev
```

Frontend runs on: `http://localhost:3000`

#### 4. LLM Provider

This project requires an OpenAI-compatible API. Options:

| Provider | Setup |
|----------|-------|
| **LM Studio** (local) | Download models, run server on `http://localhost:1234` |
| **Ollama** (local) | Run `ollama serve` on `http://localhost:11434` |
| **vLLM** | Self-hosted inference server |
| **OpenAI** | Get API key from [platform.openai.com](https://platform.openai.com) |

Configure in `.env`:
```bash
API_KEY=your-api-key
BASE_URL=http://localhost:1234/v1
CHAT_MODEL=your-model-name
```

---

## 📦 Docker Deployment

### Local Development (LM Studio)

LM Studio runs on your host machine. The backend container reaches it via `host-gateway`:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
API_KEY=lm_studio
BASE_URL=http://host-gateway:1234/v1
CHAT_MODEL=your-model-name
DOCKER_IMAGE_BACKEND=sorry-not-hired-backend
DOCKER_IMAGE_FRONTEND=sorry-not-hired-frontend
TAG=latest
VITE_BASE_URL=http://localhost:8000/api/v1
```

```bash
docker compose up --build
```

### Production (Ollama on self-hosted server)

The production setup uses Ollama with a custom GGUF model. The model file lives on the host server and is mounted into the Ollama container — it is **not** baked into the image and **not** tracked in git.

#### One-time server setup

Download the model directly on the server (only needed once):

```bash
mkdir -p /data/sorrynotnhired/models
cd /data/sorrynotnhired/models

pip install huggingface_hub
huggingface-cli download \
  HauhauCS/Qwen3.5-2B-Uncensored-GGUF \
  Qwen3.5-2B-Uncensored-HauhauCS-Aggressive-Q8_0.gguf \
  --local-dir .
```

#### Production environment variables

```bash
API_KEY=ollama
BASE_URL=http://ollama:11434/v1
CHAT_MODEL=qwen3.5-uncensored
DOCKER_IMAGE_BACKEND=ghcr.io/yourusername/sorrynotnhired-backend
DOCKER_IMAGE_FRONTEND=ghcr.io/yourusername/sorrynotnhired-frontend
TAG=0.1.0
VITE_BASE_URL=https://yourdomain.com/api/v1
```

#### Deploy

```bash
docker compose up -d
```

Services available at:
- **Frontend:** `http://localhost:80`
- **Backend API:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/docs`

On first boot, `ollama-init` registers the model from the mounted GGUF into the `ollama_data` volume. Subsequent deploys skip this step automatically.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_KEY` | LLM API key | `lm_studio` |
| `BASE_URL` | LLM API base URL | `http://localhost:1234/v1` |
| `CHAT_MODEL` | Model name | `qwen3.5-2b-uncensored-hauhaucs-aggressive` |
| `DOCKER_IMAGE_BACKEND` | Backend image name | `sorry-not-hired-backend` |
| `DOCKER_IMAGE_FRONTEND` | Frontend image name | `sorry-not-hired-frontend` |
| `TAG` | Image tag | `latest` |
| `VITE_BASE_URL` | Frontend API URL | `http://localhost:8000/api/v1` |

See `.env.example` for the full list.

---

## ☁️ Coolify Deployment

This project is designed to be deployed via [Coolify](https://coolify.io/) on a self-hosted VPS.

### Recommended server spec

- 4 dedicated CPU cores
- 8 GB RAM minimum (Ollama is capped at 3 GB via compose resource limits)
- 20 GB+ NVMe storage

### Setup

1. Install Coolify on your server
2. Add your server under **Servers**
3. Open the server terminal and run the one-time model download above
4. Create a new project in Coolify → **Docker Compose**
5. Point it at your repository
6. Add your production environment variables under **Environment Variables**
7. Configure your GHCR credentials under **Sources → Container Registries**
8. Deploy

Every subsequent `git push` redeploys the backend and frontend. Ollama and the model file are unaffected by redeploys.

---

## 📚 API Reference

### Health Endpoints

#### Liveness Probe
```bash
GET /api/v1/health/liveness
```
Returns `200 OK` if the service is running.

#### Readiness Probe
```bash
GET /api/v1/health/readiness
```
Returns `200 OK` if ready to serve traffic, `503` otherwise. Includes LLM connectivity check.

---

### CV Roast Endpoint

#### Upload CV and Get Roast
```bash
POST /api/v1/chat/message
Content-Type: multipart/form-data

FormData:
  file: <PDF file>

Response: 200 OK
{
  "roast": "Your brutally honest feedback...",
  "severity": "medium",
  "filename": "resume.pdf"
}
```

**Response Fields:**
- `roast` (string): The AI-generated critique, formatted in paragraphs
- `severity` (string): Roast intensity level — `light`, `medium`, or `harsh`
- `filename` (string): Name of the uploaded PDF file

**Error Response:**
```json
{ "error": "Not a PDF file" }
```

---

## 🧪 Testing

### Frontend

```bash
cd frontend

# Run tests
bun run test

# Linting
bun run lint

# Formatting check
bun run format
```

### Backend

```bash
cd backend

# Run tests
uv run pytest

# Linting
uv run ruff check .
```

---

## 🛠️ Development

### Project Structure

```
sorry-not-hired/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── chat/          # CV roast endpoint
│   │   │   │   ├── models.py  # Pydantic schemas
│   │   │   │   └── router.py  # POST /chat/message
│   │   │   ├── health/
│   │   │   │   ├── models.py  # Health check schemas
│   │   │   │   └── router.py  # GET /health/liveness, /readiness
│   │   │   └── router.py      # API router
│   │   ├── core/
│   │   │   └── agent.py       # Pydantic AI agent setup
│   │   ├── schemas/           # Shared Pydantic models
│   │   ├── app.py             # FastAPI app factory
│   │   ├── config.py          # Environment configuration
│   │   ├── main.py            # Entry point
│   │   └── middleware.py      # CORS setup
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatPhone.tsx  # Main chat UI component
│   │   ├── models/
│   │   │   └── roast.ts       # TypeScript types
│   │   ├── routes/
│   │   │   ├── __root.tsx     # Root layout
│   │   │   └── index.tsx      # Home page
│   │   ├── main.tsx           # Entry point
│   │   ├── router.tsx         # Router configuration
│   │   └── routeTree.gen.ts   # Auto-generated routes
│   ├── package.json
│   └── Dockerfile
├── models/                    # GGUF files — gitignored, lives on server
├── compose.yml                # Docker Compose config
├── Modelfile                  # Ollama model definition
├── init-ollama.sh             # One-time model registration script
├── ROADMAP.md                 # Development roadmap
└── .env.example               # Environment template
```

---

## 🔒 Security Considerations

### Current Implementation
- ✅ File type validation (content-type + extension check)
- ✅ File size limits (FastAPI default)
- ✅ CORS configured for localhost development
- ✅ No persistent storage (in-memory processing)
- ✅ Security headers (via FastAPI)
- ✅ Container resource limits (CPU + memory caps on Ollama)

### Out of Scope
- ❌ User authentication (by design — no accounts)
- ❌ Rate limiting
- ❌ File persistence

### Recommendations for Production
1. Add rate limiting (e.g., slowapi)
2. Enable HTTPS with Let's Encrypt (handled by Coolify/Traefik)
3. Add request size limits
4. Implement file scanning for malware
5. Set up monitoring and abuse detection
6. Consider temporary file cleanup for large deployments
