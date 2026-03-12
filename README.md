# SorryNotHired 🤖📄

> AI-powered CV roast service. Upload your resume and get brutally honest feedback.

**Status:** 🚧 In Development | **Version:** 0.1.0

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
| **Infrastructure** | Docker, Docker Compose |
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
cd cv-roaster
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
# BASE_URL=http://localhost:1234/v1  # or your preferred provider
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

### Build and Run

```bash
# Copy environment file
cp .env.example .env

# Edit with your configuration
nano .env

# Build and start all services
docker compose up --build
```

Services available at:
- **Frontend:** `http://localhost:80`
- **Backend API:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/docs`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_KEY` | Your LLM API key | `qwen3.5-2b-uncensored...` |
| `BASE_URL` | LLM API base URL | `http://127.0.0.1:1234/v1` |
| `CHAT_MODEL` | Model name to use | `lm_studio` |
| `DOCKER_IMAGE_BACKEND` | Backend image name | `cv-roaster-backend` |
| `DOCKER_IMAGE_FRONTEND` | Frontend image name | `cv-roaster-frontend` |
| `TAG` | Image tag | `latest` |
| `VITE_API_URL` | Frontend API URL | `http://localhost:8000` |

See `.env.example` for the full list.

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
Returns `200 OK` if ready to serve traffic, `503` otherwise. Includes LM Studio connectivity check.

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
- `severity` (string): Roast intensity level - `light`, `medium`, or `harsh`
- `filename` (string): Name of the uploaded PDF file

**Error Response:**
```json
{ "error": "Not a PDF file" }
```

---

## 🧪 Testing

### Backend

```bash
cd backend

# Run tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Type checking
mypy src/

# Linting
ruff check src/
```

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

---

## 🛠️ Development

### Project Structure

```
cv-roaster/
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
├── compose.yml            # Docker Compose config
├── ROADMAP.md             # Development roadmap
└── .env.example           # Environment template
```

### Code Quality

This project uses:
- **Backend:** `ruff` (linting), `mypy` (types)
- **Frontend:** `biome` (linting + formatting)

Pre-commit hooks are recommended (see `ROADMAP.md` Phase 5).

---

## 📈 Roadmap

See [ROADMAP.md](./ROADMAP.md) for the development plan.

**Current Phase:** Core Functionality ✅

**Implemented:**
- [x] Backend API with FastAPI
- [x] CV upload endpoint with PDF validation
- [x] Text extraction using pymupdf4llm
- [x] AI agent with Pydantic AI (structured JSON output)
- [x] Health endpoints (liveness, readiness)
- [x] Frontend chat-style UI
- [x] File upload with streaming response

**Next Milestones:**
- [ ] Enhanced agent prompts and roast quality
- [ ] Response streaming improvements
- [ ] Additional UI polish and animations
- [ ] Comprehensive testing

---

## 🔒 Security Considerations

### Current Implementation
- ✅ File type validation (content-type + extension check)
- ✅ File size limits (FastAPI default)
- ✅ CORS configured for localhost development
- ✅ No persistent storage (in-memory processing)
- ✅ Security headers (via FastAPI)

### Out of Scope
- ❌ User authentication (by design - no accounts)
- ❌ Rate limiting
- ❌ File persistence

### Recommendations for Production
1. Add rate limiting (e.g., slowapi)
2. Enable HTTPS with Let's Encrypt
3. Add request size limits
4. Implement file scanning for malware
5. Set up monitoring and abuse detection
6. Consider temporary file cleanup for large deployments

---

## 🤝 Contributing

Contributions welcome! Please:

1. Check the [ROADMAP.md](./ROADMAP.md) for planned features
2. Create an issue before starting work
3. Follow existing code style
4. Add tests for new functionality

---

## 📄 License

MIT License - see LICENSE file for details.

---

## ⚠️ Disclaimer

This project is for entertainment purposes only. The AI-generated roasts are meant to be humorous and should not be taken as professional career advice. No human reviewers were harmed in the making of this application.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-username/cv-roaster/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/cv-roaster/discussions)

---

*Built with ☕ and questionable AI decisions*
