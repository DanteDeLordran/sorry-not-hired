# CV Roaster 🤖📄

> AI-powered CV roast service. Upload your resume and get brutally honest feedback.

**Status:** 🚧 In Development | **Version:** 0.1.0

---

## 🎯 What It Does

CV Roaster uses AI to analyze your CV and deliver a no-holds-barred critique. No corporate speak, no sugar-coating—just honest (and entertaining) feedback about your resume.

**Features:**
- 📤 PDF upload with instant text extraction
- 🤖 AI-powered roast generation
- ⚡ Real-time processing status
- 🎨 Modern, responsive UI
- 🔒 Auto-delete after 24 hours

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│   LLM API   │
│  (React +   │     │   (FastAPI)  │     │  (OpenAI-   │
│  TanStack)  │◀────│  + Pydantic  │     │  compatible)│
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Redis +    │
                    │  PostgreSQL  │
                    └──────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TanStack Router, Tailwind CSS v4, Bun |
| **Backend** | Python 3.14, FastAPI, Pydantic AI, uv |
| **LLM** | OpenAI-compatible API (self-hosted or cloud) |
| **Infrastructure** | Docker, nginx, Redis, PostgreSQL |
| **Tooling** | Biome (lint/format), Vitest (testing) |

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
# OPENAI_API_KEY=your-key-here
# OPENAI_BASE_URL=http://localhost:1234/v1  # or your preferred provider

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
| **OpenAI** | Get API key from [platform.openai.com](https://platform.openai.com) |
| **Ollama** | Run `ollama serve` on `http://localhost:11434` |
| **vLLM** | Self-hosted inference server |

Configure in `.env`:
```bash
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=http://localhost:1234/v1
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
| `OPENAI_API_KEY` | Your LLM API key | `lm_studio` |
| `OPENAI_BASE_URL` | LLM API base URL | `http://127.0.0.1:1234/v1` |
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
Returns `200 OK` if ready to serve traffic, `503` otherwise.

---

### CV Endpoints (Planned)

#### Upload CV
```bash
POST /api/v1/cv/upload
Content-Type: multipart/form-data

Response: { "job_id": "uuid" }
```

#### Check Status
```bash
GET /api/v1/cv/{job_id}/status

Response: { "status": "pending|processing|completed|failed" }
```

#### Get Result
```bash
GET /api/v1/cv/{job_id}/result

Response: { "roast": "Your CV is..." }
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
│   │   ├── handlers/      # API route handlers
│   │   ├── models/        # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── app.py         # FastAPI app factory
│   │   └── main.py        # Entry point
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── routes/        # File-based routes
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── Dockerfile
├── compose.yml            # Docker Compose config
├── ROADMAP.md             # Development roadmap
└── .env.example           # Environment template
```

### Code Quality

This project uses:
- **Backend:** `ruff` (linting), `black` (formatting), `mypy` (types)
- **Frontend:** `biome` (linting + formatting)

Pre-commit hooks are recommended (see `ROADMAP.md` Phase 5).

---

## 📈 Roadmap

See [ROADMAP.md](./ROADMAP.md) for the complete development plan.

**Current Phase:** 1 - Core Functionality

**Next Milestones:**
1. CV upload endpoint with file validation
2. Async processing with background tasks
3. Frontend upload UI
4. Structured logging

---

## 🔒 Security Considerations

### Current Implementation
- ✅ File type validation (magic bytes)
- ✅ File size limits (10MB max)
- ✅ Auto-delete after 24 hours
- ✅ Security headers (nginx)
- ✅ No data persistence (temp files only)

### Out of Scope
- ❌ User authentication (by design)
- ❌ Rate limiting per user (IP-based only)

### Recommendations for Production
1. Add Cloudflare or similar for DDoS protection
2. Enable HTTPS with Let's Encrypt
3. Set up regular security audits
4. Monitor for abuse patterns

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
