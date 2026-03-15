# SorryNotHired Backend 🐍

> FastAPI backend for AI-powered CV roasting

**Framework:** FastAPI + Pydantic AI  
**Python:** 3.13+  
**Package Manager:** uv

---

## 🎯 What It Is

A FastAPI backend that accepts PDF CVs, extracts text using `pymupdf4llm`, and uses a Pydantic AI agent to generate brutally honest roast feedback. The AI is prompted to act as an HR recruiter venting to a coworker.

**Features:**
- 📄 PDF upload with content-type validation
- 📝 Text extraction via pymupdf4llm (Markdown output)
- 🤖 Pydantic AI agent with structured JSON output
- 🏥 Health endpoints (liveness, readiness with LM Studio check)
- 🔌 OpenAI-compatible API support (LM Studio, Ollama, vLLM, OpenAI)

---

## 🚀 Quick Start

### Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Python 3.13 or higher
- LLM provider (LM Studio, Ollama, or OpenAI-compatible API)

### Installation

```bash
# Install dependencies
uv sync

# Copy environment file from project root
cp ../.env.example .env

# Edit with your LLM credentials
# API_KEY=your-api-key
# BASE_URL=http://localhost:1234/v1
# CHAT_MODEL=your-model-name
```

### Development Server

```bash
# Run with hot reload
fastapi dev src/app.py

# Or using uv
uv run fastapi dev src/app.py
```

Server runs on: `http://localhost:8000`

**API Docs:** `http://localhost:8000/docs`

---

## 📡 API Reference

### Health Endpoints

#### Liveness Probe
```bash
GET /api/v1/health/liveness
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-11T12:00:00Z",
  "version": "0.1.0",
  "checks": {
    "app": { "ok": true }
  }
}
```

#### Readiness Probe
```bash
GET /api/v1/health/readiness
```

Checks:
- Application readiness
- LM Studio / LLM API connectivity

**Response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-11T12:00:00Z",
  "version": "0.1.0",
  "checks": {
    "app": { "ok": true },
    "lmstudio": { "ok": true, "latency_ms": 45.2 }
  }
}
```

**Response (unhealthy):**
```json
{
  "status": "unhealthy",
  "checks": {
    "app": { "ok": true },
    "lmstudio": { "ok": false, "detail": "Connection refused" }
  }
}
```

---

### CV Roast Endpoint

#### Upload and Roast
```bash
POST /api/v1/chat/message
Content-Type: multipart/form-data

FormData:
  file: <PDF file>
```

**Success Response (200):**
```json
{
  "roast": "Oh honey, where do I even start? 🙄\n\nFirst of all, your 'objective' section reads like you wrote it in 2015...",
  "severity": "medium",
  "filename": "resume.pdf"
}
```

**Error Response (400):**
```json
{
  "error": "Not a PDF file"
}
```

---

## 🏗️ Architecture

### Project Structure

```
src/
├── api/
│   ├── chat/
│   │   ├── models.py      # RoastOutput, RoastResponse schemas
│   │   └── router.py      # POST /chat/message endpoint
│   ├── health/
│   │   ├── models.py      # HealthStatus, CheckResult schemas
│   │   └── router.py      # GET /health/* endpoints
│   └── router.py          # API router (includes sub-routers)
├── core/
│   └── agent.py           # Pydantic AI agent factory
├── schemas/               # Shared Pydantic models (empty)
├── app.py                 # FastAPI app factory
├── config.py              # Environment configuration
├── main.py                # Entry point
└── middleware.py          # CORS middleware setup
```

### Request Flow

```
1. Client uploads PDF → POST /api/v1/chat/message
2. Validate file (content-type + extension)
3. Extract text using pymupdf4llm → Markdown
4. Pass to Pydantic AI agent with system prompt
5. Agent calls LLM → Structured JSON output
6. Return roast response to client
```

---

## 🤖 AI Agent

### Configuration

The agent is configured in `src/core/agent.py`:

```python
agent = Agent(
    model,  # OpenAI-compatible model
    output_type=RoastOutput,  # Structured JSON output
    model_settings=ModelSettings(
        max_tokens=2000,
        temperature=0.7
    ),
    system_prompt="""..."""  # HR recruiter persona
)
```

### System Prompt

The AI is prompted to act as a senior HR recruiter venting to a coworker:

- **Persona:** Senior recruiter at a prestigious company
- **Context:** Private text conversation with coworker
- **Tone:** Unfiltered, casual, cruel, dramatic
- **Format:** JSON with `roast` and `severity` fields

### Output Schema

```python
class RoastOutput(BaseModel):
    roast: str        # The actual roast text
    severity: str     # "light", "medium", or "harsh"
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_KEY` | LLM API key | `qwen3.5-2b-uncensored...` |
| `BASE_URL` | LLM API base URL | `http://127.0.0.1:1234/v1` |
| `CHAT_MODEL` | Model name | `lm_studio` |

### Loading Configuration

```python
from config import get_env_vars

env = get_env_vars()
print(env.API_KEY)
print(env.BASE_URL)
print(env.CHAT_MODEL)
```

---

## 🧪 Testing

```bash
# Run tests (when implemented)
pytest

# With coverage
pytest --cov=src --cov-report=html

# Type checking
mypy src/

# Linting
ruff check src/
```

---

## 🎨 Code Quality

```bash
# Format (if black is added)
black src/

# Lint
ruff check src/

# Type check
mypy src/
```

---

## 🐳 Docker

Build and run from project root:

```bash
# Build image
docker build -f backend/Dockerfile -t cv-roaster-backend .

# Run container
docker run -p 8000:8000 --env-file .env cv-roaster-backend
```

Or use Docker Compose:

```bash
docker compose up --build
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi[standard]` | Web framework |
| `pydantic-ai-slim[openai]` | AI agent framework |
| `pymupdf4llm` | PDF to Markdown extraction |
| `python-multipart` | Form data handling |
| `httpx` | Async HTTP client |

---

## 🔌 LLM Providers

### LM Studio (Local)

```bash
# 1. Download LM Studio
# 2. Download a model (e.g., Qwen, Llama)
# 3. Start local server
# 4. Configure:
API_KEY=lm_studio
BASE_URL=http://localhost:1234/v1
CHAT_MODEL=your-model-name
```

### Ollama (Local)

```bash
# 1. Install Ollama
# 2. Pull model: ollama pull llama3.2
# 3. Start server: ollama serve
# 4. Configure:
API_KEY=ollama
BASE_URL=http://localhost:11434/v1
CHAT_MODEL=llama3.2
```

### OpenAI (Cloud)

```bash
# Configure:
API_KEY=sk-...
BASE_URL=https://api.openai.com/v1
CHAT_MODEL=gpt-4o
```

### vLLM (Self-hosted)

```bash
# 1. Deploy vLLM server
# 2. Configure:
API_KEY=your-key
BASE_URL=http://your-vllm-server:8000/v1
CHAT_MODEL=your-model
```

---

## 🛠️ Development

### Adding New Endpoints

1. Create router in `src/api/<feature>/router.py`:

```python
from fastapi import APIRouter

router = APIRouter(prefix="/<feature>")

@router.get("/example")
async def example():
    return {"message": "Hello"}
```

2. Include in `src/api/router.py`:

```python
from api.<feature> import router as feature_router

api.include_router(feature_router.router)
```

### Adding Pydantic Models

1. Create schema in `src/api/<feature>/models.py`:

```python
from pydantic import BaseModel, Field

class ExampleResponse(BaseModel):
    message: str = Field(..., description="Response message")
```

2. Use in router:

```python
@router.get("/example", response_model=ExampleResponse)
async def example():
    return ExampleResponse(message="Hello")
```

### Creating New Agents

```python
from pydantic_ai.agent import Agent
from core.agent import create_agent  # or create custom factory

def create_custom_agent() -> Agent:
    agent = Agent(
        model,
        output_type=YourOutputSchema,
        system_prompt="Your custom prompt"
    )
    return agent
```

---

## 🔒 Security

### Current Implementation

- ✅ Content-type validation for file uploads
- ✅ File extension validation
- ✅ CORS configured for localhost
- ✅ No file persistence (in-memory only)
- ✅ Immutable health status models

### Recommendations

1. Add file size limits explicitly
2. Implement rate limiting (e.g., `slowapi`)
3. Add malware scanning for uploads
4. Enable HTTPS in production
5. Add request logging and monitoring

---

## 📝 Notes

### PDF Extraction

Uses `pymupdf4llm` for converting PDF to Markdown:

```python
import pymupdf4llm
from io import BytesIO

cv_text = pymupdf4llm.to_markdown(BytesIO(pdf_content))
```

### Error Handling

File validation returns a simple error object:

```python
if file.content_type != "application/pdf":
    return {"error": "Not a PDF file"}
```

### Lifespan Events

App startup/shutdown handled in `src/app.py`:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    yield
    print("Shutting down...")
```

---

## 📚 Learn More

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Pydantic AI Docs](https://ai.pydantic.dev/)
- [pymupdf4llm](https://pymupdf.readthedocs.io/en/latest/pymupdf4llm/)
- [uv Package Manager](https://docs.astral.sh/uv/)

---

*Built with ☕ and questionable career advice*
