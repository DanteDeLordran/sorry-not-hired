# SorryNotHired Roadmap

Last updated: October 21, 2026.

## Current Status — 1.0.0

The CV-to-roast flow is implemented and verified with automated tests and local Docker checks. Both packages are version `1.0.0`. Production deployment configuration is available for Caddy and Coolify; live-server verification is still pending.

### Core Experience

- [x] Upload a PDF CV and extract its text as Markdown.
- [x] Reject invalid, unreadable, oversized, and non-CV files.
- [x] Send the full accepted CV to an OpenAI-compatible model API.
- [x] Stream one Karen roast into a single chat bubble, ending with `sorry, not hired`.
- [x] Preserve JSON responses for API clients that do not request streaming.
- [x] Support DeepSeek, external OpenAI-compatible providers, and optional bundled Ollama.
- [x] Handle unavailable or non-responding providers, generation timeouts, and interrupted streams with fallback messages.
- [x] Provide a responsive React UI with PDF drag-and-drop, file validation, typing feedback, and chat reset.
- [x] Add Karen artwork, favicon assets, and application metadata.

### Reliability And Deployment

- [x] Isolate PDF parsing in child processes with page, text, memory, CPU, and wall-clock limits.
- [x] Kill and reap parser processes on timeout or cancellation without passing API credentials to them.
- [x] Bound model output, generation time, retries, and concurrent requests.
- [x] Apply per-client proxy rate limits and per-client/global concurrency limits, including active streams.
- [x] Run application containers as non-root with read-only filesystems and bounded temporary storage.
- [x] Add security/cache headers and trusted-proxy HTTPS enforcement with HSTS.
- [x] Provide local Compose, a Caddy HTTPS overlay, and a standalone Coolify/Traefik Compose file.
- [x] Document provider settings, production deployment, updates, and rollback steps in [README.md](README.md).
- [x] Verify backend behavior, frontend stream parsing, container startup, API forwarding, streaming, and proxy controls.
- [x] Add an opt-in DeepSeek model benchmark for latency and output comparison.

### Production Verification

- [ ] Deploy the selected Git revision to the target production server.
- [ ] Verify public DNS, certificate issuance, HTTP-to-HTTPS redirects, HSTS, and container health on that server.
- [ ] Upload a representative CV through the public domain and confirm streaming with the configured provider.

See [the Coolify deployment guide](README.md#coolify-single-compose-file) for the single-file setup and verification commands.

## Post-Production Features

- [ ] Share conversations.
- [ ] Store uploaded PDFs for analytics.
- [ ] Store chat history for analytics.

There is currently no database or persistent conversation storage. Uploaded PDFs are temporary and deleted after processing; chat state lives in the current browser page.
