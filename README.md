# SorryNotHired

**Roasting as a service.**

Send your CV to Karen, head of HR at the absurdly prestigious fictional Acme Corp. She replies directly with one brutal roast, finds something to mock even in a perfect CV, and always ends with `sorry, not hired`.

The roast uses concrete details from your CV, with mandatory uncensored profanity, direct insults, and vicious corporate sarcasm. Karen skips compliments and polite rejection-letter language. It targets professional claims and self-presentation, without identity-based slurs or invented failures.

This is mostly a joke project, but the stack is real: React on the frontend, FastAPI on the backend, and a local or hosted LLM behind an OpenAI-compatible API.

## Status

Version `1.0.0` for both the frontend and backend. The core flow works end to end: PDF upload, text extraction, non-CV file rejection, streaming roast generation, and fallback messages for unavailable or slow providers. Deployment supports local Docker Compose, Caddy-managed production HTTPS, and a standalone Compose file for Coolify. The backend and optional Ollama have no published host ports.

For production on Coolify, start with [Coolify: Single Compose File](#coolify-single-compose-file). Container builds, health checks, streaming, request limits, and trusted-proxy HTTPS behavior have been verified locally; public DNS, certificate issuance, and the configured provider still need verification on your deployment server.

The `1.1.0` development branch adds read-only chat sharing through self-contained links, without server-side conversation storage. Both package versions remain `1.0.0` until the next release. PDF and chat history retention for analytics are outside the roadmap. See [ROADMAP.md](ROADMAP.md) for scope and remaining release checks.

## Stack

| Part | Tech |
| --- | --- |
| Frontend | React 19, Vite, Bun |
| Backend | FastAPI, OpenAI SDK, pymupdf4llm, uv |
| Model API | DeepSeek, LM Studio, Ollama, vLLM, OpenAI, or anything OpenAI-compatible |
| Deployment | Docker Compose, Nginx, Caddy or Coolify/Traefik HTTPS ingress |

## How It Works

1. The frontend sends a PDF as `multipart/form-data`.
2. The backend checks the upload and extracts Markdown from the PDF.
3. The extracted CV text is sent to the configured LLM.
4. Karen's response streams into a single chat bubble, with any paragraphs kept inside it. The backend normalizes the final line to exactly `sorry, not hired`. API clients can still request a JSON response.

There is no database and no user account system. Uploads use temporary files during processing and are deleted afterwards. Docker stores those temporary files in bounded memory-backed filesystems.

## Sharing A Chat

After a roast finishes, use the link icon in the chat header to open the sharing preview. Review the messages, then choose **Copy link**. If clipboard access is unavailable, select and copy the displayed link manually.

The link opens `/share#v1.<payload>` as a read-only conversation. Recipients can start their own separate roast, but cannot upload, send, reset, or regenerate messages in the shared chat. The link continues to work after the sender resets their chat or closes the page, provided the app remains available and supports the link format.

Sharing happens entirely in the browser:

- The payload contains only message senders, text, and timestamps. Upload messages become a generic **CV uploaded** placeholder; the PDF, original filename, file size, and extracted CV text are excluded. Karen's replies remain as written and may quote details from the CV.
- The browser compresses the snapshot with gzip, encodes it as Base64url, and places it after `#` in the URL. The recipient's browser decodes it locally. Shared messages are not sent to the backend or model API, and the app does not save them in a database, local storage, or session storage.
- Links are limited to **8,000 characters**, including the origin and path. Decoded snapshots are limited to **64 KiB of UTF-8 JSON**, **100 messages**, and **16,000 JavaScript string characters per message**. Oversized chats are rejected without truncation. Browsers and messaging apps may impose additional limits; the application limit does not guarantee compatibility with every sharing channel.
- The browser must support `CompressionStream` and `DecompressionStream` with gzip. Missing support, malformed payloads, and unsupported link versions produce an error message.

Anyone with the full link can read or modify its contents. Read-only applies to the viewing interface; the link is not proof of authorship and cannot be centrally revoked. Compression and encoding do not encrypt it. Social previews use generic app information because the chat payload is not part of the server request.

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

## DeepSeek API

The backend uses DeepSeek's OpenAI-compatible Chat Completions endpoint. Create an [API key](https://platform.deepseek.com/api_keys), copy `.env.example` to `.env`, and set:

```dotenv
COMPOSE_PROFILES=
API_KEY=your-deepseek-api-key
BASE_URL=https://api.deepseek.com
CHAT_MODEL=deepseek-v4-pro
```

Keep the image names and tag from `.env.example`, then run from the repository root. Generation, PDF processing, and request limits already have built-in defaults:

```bash
docker compose up --build
```

An empty `COMPOSE_PROFILES` starts just the frontend and backend. No local model download is needed. If Ollama containers are already running from a previous deployment, stop them with `docker compose --profile ollama stop ollama ollama-init`.

For local development, load the same `.env` explicitly (from the repository root):

```bash
uv run --package backend --env-file .env fastapi dev backend/src/main.py
```

The API key is used only by the backend. The extracted CV text is sent to DeepSeek for generation.

### Context And Prompt

- DeepSeek currently documents a **1M-token context window** for `deepseek-v4-pro` and `deepseek-flash` ([model details](https://api-docs.deepseek.com/quick_start/pricing), checked October 19, 2026). The window is determined by the hosted model; there is no local context-size setting to increase.
- The backend sends the **entire accepted CV**, without truncation or summarization. PDFs over 5 MB, 20 pages, or 100,000 extracted characters are rejected by default. `MAX_PDF_PAGES` and `MAX_CV_CHARS` configure the latter limits. Character limits are a cheap input-cost bound, not an exact token count; choose a smaller limit for local models with small context windows. Each upload is an independent review.
- `MAX_OUTPUT_TOKENS` controls the generated response budget, **not** input context. Input plus output must fit the model's window. The default is `2048`, with room for the requested 180–280-word roast.
- `backend/src/core/llm.py` contains Karen's system prompt and the single Chat Completions call. It asks the model to connect evidence across CV sections, quote specific claims, and roast even strong qualifications in one direct reply. The roast follows the CV's language; the fixed closing line stays in English. A small trailing buffer normalizes the verdict before completion; failed or truncated generations are reported as errors.
- Requests to `api.deepseek.com` explicitly disable thinking mode for faster creative responses and use DeepSeek's documented `max_tokens` parameter.
- `AGENT_TIMEOUT_SECONDS` defaults to `120`. If you increase it, also raise `proxy_read_timeout` in `frontend/nginx.conf` above that value (currently `135s`).

## Docker

Choose the deployment setup that matches your environment:

| Target | Compose configuration | Public entry point |
| --- | --- | --- |
| Local Docker | `compose.yml` | `http://127.0.0.1:8080` |
| Server with automatic HTTPS | `compose.yml` + `compose.production.yml` | Caddy on ports 80/443 |
| Coolify with its standard Traefik proxy | `compose.coolify.yml` | Coolify proxy on ports 80/443 |

The Coolify file is standalone and uses environment variables configured in Coolify. The local and Caddy setups use the `.env` workflow below.

Copy the sample environment file first:

```bash
cp .env.example .env
```

The sample environment enables the bundled Ollama service with `COMPOSE_PROFILES=ollama`. To use LM Studio running on the host instead, set these values in `.env`:

```bash
COMPOSE_PROFILES=
API_KEY=lm_studio
BASE_URL=http://host-gateway:1234/v1
CHAT_MODEL=your-model-name
```

Then run:

```bash
docker compose up --build
```

Local Docker development is available at `http://127.0.0.1:8080`. `HTTP_BIND` and `HTTP_PORT` control this binding. The backend and optional Ollama have no published ports. Nginx proxies `/api/` to the backend. With the `ollama` profile enabled, the backend defaults to `http://ollama:11434/v1`.

### Production HTTPS

Set `PUBLIC_HOST` in `.env` to a DNS hostname pointing to your server, allow inbound ports 80 and 443, then run:

```bash
docker compose -f compose.yml -f compose.production.yml up --build -d
```

This adds Caddy for automatic TLS certificates and HTTP-to-HTTPS redirects, removes the frontend's direct host port, and enables HTTPS enforcement and HSTS. Requires Docker Compose 2.24.4+. The dedicated ingress subnet defaults to `172.30.0.0/24`; change `INGRESS_SUBNET` and `INGRESS_PROXY_IP` together if it conflicts with your network.

### Coolify: Single Compose File

Use **`compose.coolify.yml`** for a standalone production deployment with Coolify's standard **Traefik** proxy and a hosted model API (DeepSeek by default). It builds both images from this repository, routes HTTPS to the frontend on container port `8080`, and keeps the backend on the application's private network. Coolify's proxy handles certificates and HTTP-to-HTTPS redirects.

1. Commit and push the application files, including `compose.coolify.yml`, to your Git repository.
2. Point your domain's DNS to the deployment server and allow inbound ports **80** and **443**. Ensure Coolify's Traefik proxy is running.
3. In Coolify, add an application **from that Git repository**, select the branch containing the deployment files, and choose the **Docker Compose** build pack/build strategy. Set:
   - **Base Directory:** `/`
   - **Docker Compose Location:** `/compose.coolify.yml`
   - **Advanced → Docker compose → Compose deployment:** **Raw (deploy file as-is)** (called **Raw Compose Deployment** in older versions).
   - **Advanced → Build → Build arguments:** **Managed manually in Dockerfile** (disable automatic build-argument injection in older versions).

   This file supplies its own proxy labels and networks. The public domain comes from `PUBLIC_HOST` below. Git-based deployment provides the source files required by `build:`; use this flow rather than pasting the file into **Docker Compose Empty**.
4. On the **deployment server**, get the proxy's IP on the `coolify` network:

   ```bash
   docker inspect coolify-proxy --format '{{ (index .NetworkSettings.Networks "coolify").IPAddress }}'
   ```

5. In the application's **Environment Variables**, set:

   ```dotenv
   PUBLIC_HOST=roast.example.com
   API_KEY=your-deepseek-api-key
   BASE_URL=https://api.deepseek.com
   CHAT_MODEL=deepseek-v4-pro
   TRUSTED_PROXY_CIDRS=172.18.0.2/32
   ```

   Replace `172.18.0.2` with the actual proxy IP from step 4. `PUBLIC_HOST` is a hostname only, without `https://`, a path, or `:8080`. Make these variables available at **build time and runtime**: Compose evaluates required variables even during `docker compose build`. With build arguments managed manually, the Dockerfiles do not consume them; `API_KEY` is passed only to the running backend. For another OpenAI-compatible provider, change `API_KEY`, `BASE_URL`, and `CHAT_MODEL` together.
6. Save and **Deploy**, then open `https://roast.example.com`. Check the deployment logs and confirm both containers are healthy. Verify the public API with:

   ```bash
   curl --fail https://roast.example.com/api/v1/health/liveness
   curl -I https://roast.example.com
   curl -I http://roast.example.com
   ```

   Expect a successful health response, an HTTPS response containing `Strict-Transport-Security`, and an HTTP redirect to HTTPS. Upload a CV to verify model generation and streaming.

**Proxy configuration:** this file uses Coolify's default network `coolify`, entrypoints `http`/`https`, and certificate resolver `letsencrypt`. If your proxy uses different names, update the network and labels in the file to match. The `sorry-not-hired` router/service/middleware names are reserved for this deployment; use distinct names when deploying another copy on the same proxy.

**HTTPS redirect loops:** confirm `TRUSTED_PROXY_CIDRS` matches the proxy's current IP on the `coolify` network; update it and redeploy if the proxy was recreated with another IP. Nginx accepts forwarded client IPs and HTTPS scheme only from configured trusted sources. Use exact proxy IPs (`/32` for IPv4, `/128` for IPv6; space-separated for multiple proxies), and keep Traefik's insecure forwarded-header trust disabled.

See [Coolify's Docker Compose documentation](https://coolify.io/docs/applications/builds/docker-compose) for the Git-based deployment and Raw Compose settings.

#### Updating A Coolify Deployment

Push changes to the branch selected in Coolify, then click **Deploy**, or enable automatic deployments for that branch. Save environment-variable changes and redeploy to apply them. After each deployment, repeat the health, HTTPS, and CV-upload checks above.

To roll back this source-built Compose deployment, revert the faulty release commits on the tracked branch, push the revert, and deploy again. Restore any provider or proxy settings that changed with that release, then repeat the verification checks. The app currently has no database migrations or stored chat history to restore.

### Request And Processing Budgets

These limits have built-in defaults in `backend/src/core/config.py` and `frontend/start-nginx.sh`; they do not need entries in `.env`. The variables below are optional overrides:

| Setting | Default | Scope |
| --- | --- | --- |
| `ROAST_REQUESTS_PER_MINUTE` / `ROAST_BURST` | 6 / 2 | Per client IP at Nginx, shared across its workers |
| `MAX_ROASTS_PER_IP` | 2 | Concurrent API requests per client IP |
| `MAX_CONCURRENT_ROASTS` | 4 | Shared Nginx cap plus backend admission cap, including streams |
| `MAX_PDF_JOBS` | 2 | Concurrent parser child processes per backend container |
| `PDF_TIMEOUT_SECONDS` | 15 | Parser wall-clock deadline; timed-out workers are killed and reaped |
| `PDF_MEMORY_MB` | 512 | Linux address-space limit per parser; CPU time is also limited |
| `MAX_PDF_PAGES` / `MAX_CV_CHARS` | 20 / 100000 | Reject excessive page counts and extracted text |
| `AGENT_TIMEOUT_SECONDS` | 120 | Total model-generation deadline |
| `LLM_READ_TIMEOUT_SECONDS` | 30 | Upstream read inactivity timeout |
| `LLM_MAX_RETRIES` | 0 | Automatic SDK retries; increase deliberately if needed |

The backend runs **one async worker**; CPU-heavy parsing runs in subprocesses. Do not increase Uvicorn workers without accounting for the per-process PDF/admission caps. Nginx's cap covers all backend workers behind that instance, but multiple independent frontend replicas need a shared edge limiter to retain a deployment-wide limit. Local `fastapi dev` bypasses Nginx's per-IP controls.

The backend has a 1.5 GB container memory cap, two CPUs, and a 64-process cap. Both app containers run non-root with read-only filesystems, dropped capabilities, and `no-new-privileges`. Tune Compose resource limits together with parser concurrency and memory budgets. Parser address-space limits require Linux; macOS development still has process isolation and wall-clock deadlines.

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
TAG=1.0.0
COMPOSE_PROFILES=ollama
```

Start it with:

```bash
docker compose up -d
```

On first boot, `ollama-init` registers the mounted model into the Ollama volume. Wait for it to finish before submitting a CV. Later deploys reuse that volume. If upgrading an existing `.env`, add `COMPOSE_PROFILES=ollama` to keep starting the bundled model services.

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
  "roast": "Your CV calls you a visionary. Apparently the vision stopped at this application.\n\nsorry, not hired"
}
```

Expected error cases include non-PDF uploads, oversized files, unreadable PDFs, files that do not look like CVs, and unavailable model backends.

Send `Accept: text/event-stream` for streaming. Each SSE `data` value is JSON:

```text
data: {"type":"delta","text":"Your CV..."}

data: {"type":"done"}
```

Validation and admission errors use ordinary HTTP statuses (`400`, `413`, `422`, `429`, `504`). Once streaming starts, provider failures are terminal events such as `{"type":"error","status":503,"message":"..."}`. A stream ending without `done` or `error` is incomplete. Disconnecting the client closes the upstream stream and releases capacity.

## Scripts

Frontend:

```bash
cd frontend
bun run dev
bun run build
bun run lint
bun run test
bun run format
```

Backend:

```bash
cd backend
uv sync
fastapi dev src/main.py
```

Checks from the repository root:

```bash
uv run --package backend python -m unittest discover -s backend/tests -v
bun run check
bun run --filter frontend test
bun run build
```

Docker-level checks exercise rootless startup, PDF extraction, unbuffered streaming, rate/concurrency limits, CSP inheritance, and trusted-proxy HTTPS handling against a local mock model:

```bash
DOCKER_IMAGE_BACKEND=sorry-not-hired-check-backend DOCKER_IMAGE_FRONTEND=sorry-not-hired-check-frontend TAG=security \
  docker compose --env-file .env.example build backend frontend
uv run --package backend python backend/tests/check_deployment.py
```

The checker creates temporary containers and a network, then removes them. It makes no paid model calls. `TEST_BACKEND_IMAGE` and `TEST_FRONTEND_IMAGE` can select different built images.

### Compare DeepSeek Models

With `.env` configured for DeepSeek:

```bash
uv run --package backend --env-file .env python backend/scripts/benchmark_models.py --show-output
```

This makes paid API calls to Flash and Pro, three times each across synthetic junior, senior, and Spanish CVs. It prints time-to-first-text, total latency, and roasts for a manual quality comparison; token usage is logged separately. Pass `--cv path/to/cv.txt` repeatedly to use representative extracted text, or `--runs 1` for a smaller comparison. No model change is made automatically based on latency alone.

## Project Layout

```text
sorry-not-hired/
  backend/
    src/
      api/
        chat/       PDF upload and roast endpoint
        health/     liveness endpoint
      core/         LLM streaming, settings, and isolated PDF parser
      main.py       FastAPI app
  frontend/
    src/
      components/   main chat UI
  compose.yml       app, frontend, and Ollama services
  compose.production.yml  optional Caddy HTTPS ingress
  compose.coolify.yml  standalone Coolify/Traefik production deployment
  Modelfile         Ollama model definition
  init-ollama.sh    one-time Ollama model registration
```

## Security Notes

This app accepts arbitrary PDF uploads and sends extracted CV text to an LLM. Treat it as an internet-facing upload service, not just a toy, if you deploy it publicly.

Implemented controls include per-IP rate limits, global concurrency limits, bounded uploads and extracted text, isolated parser processes with deadlines, upstream timeouts, and restricted containers. The parser does not inherit API credentials. Process/resource isolation reduces parser impact; it is not a complete OS security sandbox.

Nginx sends CSP, anti-framing, MIME-sniffing, and cache headers on HTML, assets, API responses, and errors. Inline script/style permissions are unnecessary. Hashed assets are cached; HTML and API responses use `no-store`. HTTPS responses through a trusted ingress include HSTS. React renders model output as text.

Application logs contain extraction/generation duration, model name, token usage (when supplied by the provider), finish reason, and exception classes. They omit CV content, upload filenames, API keys, and raw provider errors. Nginx logs can be used to monitor `429` responses and upstream failures. The supplied rate and input/output budgets bound abuse per request/client, not total daily spend across a distributed attack.

## Notes

The tone of the generated feedback is intentionally harsh. If you reuse this outside a joke/demo context, change the system prompt first.
