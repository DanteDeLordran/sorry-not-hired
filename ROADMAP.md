# CV Roaster - Production Roadmap

A milestone-based roadmap to production readiness. Authentication is **out of scope** per project requirements.

---

## 🎯 Phase 1: Core Functionality (MVP)

**Goal:** Working end-to-end CV upload and roast generation

### Milestone 1.1: Backend API Endpoints

- [ ] **POST /api/v1/cv/upload**
  - Accept PDF files (max 10MB)
  - Validate file type (magic bytes, not just extension)
  - Return job ID for async processing
  - Rate limit: 10 requests/minute per IP

- [ ] **GET /api/v1/cv/{job_id}/status**
  - Return processing status: `pending` | `processing` | `completed` | `failed`
  - Include error message if failed

- [ ] **GET /api/v1/cv/{job_id}/result**
  - Return roast text when complete
  - 404 if not found, 425 if still processing

**Files to create:**
```
backend/src/handlers/cv.py
backend/src/models/cv.py
backend/src/services/cv_processor.py
backend/src/services/llm.py
```

### Milestone 1.2: File Upload & Storage

- [ ] Local filesystem storage for uploads (temp)
- [ ] Automatic cleanup after 24 hours
- [ ] Unique filename generation (UUID)
- [ ] PDF text extraction with `pymupdf4llm`

### Milestone 1.3: LLM Integration

- [ ] Move model config to environment variables
- [ ] Implement retry logic with exponential backoff
- [ ] Add timeout handling (max 60s)
- [ ] Proper error messages for API failures

### Milestone 1.4: Frontend UI

- [ ] Drag-and-drop file upload component
- [ ] Progress indicator during processing
- [ ] Display roast result with copy button
- [ ] Error state handling

**Deliverable:** Working MVP - upload CV, get roast back

---

## 🎯 Phase 2: Reliability & Hardening

**Goal:** Handle failures gracefully and log everything

### Milestone 2.1: Structured Logging

- [ ] Replace all `print()` with `logging` module
- [ ] JSON log format for production
- [ ] Correlation IDs for request tracing
- [ ] Log levels: INFO for requests, DEBUG for details, ERROR for failures

**Example:**
```python
import logging
logger = logging.getLogger(__name__)

logger.info("CV upload started", extra={"job_id": job_id, "file_size": file_size})
logger.error("LLM API failed", extra={"error": str(e), "job_id": job_id})
```

### Milestone 2.2: Error Handling

- [ ] Global exception handler with proper HTTP responses
- [ ] Custom exception classes (`CVProcessingError`, `LLMAPIError`)
- [ ] User-friendly error messages (no stack traces to client)
- [ ] Error tracking (Sentry or similar)

### Milestone 2.3: Health Check Improvements

- [ ] Readiness probe checks actual LLM connectivity
- [ ] Disk space check (fail if >90% full)
- [ ] Memory usage check
- [ ] Remove hardcoded URLs from health checks

### Milestone 2.4: Rate Limiting

- [ ] Install `slowapi` or `fastapi-limiter`
- [ ] Default: 100 requests/hour per IP
- [ ] Upload endpoint: 10 requests/hour per IP
- [ ] Return 429 with `Retry-After` header

**Deliverable:** System handles failures gracefully with full observability

---

## 🎯 Phase 3: Performance & Scalability

**Goal:** Handle concurrent users efficiently

### Milestone 3.1: Async Processing

- [ ] Move CV processing to background task (Celery or FastAPI `BackgroundTasks`)
- [ ] Redis queue for job management
- [ ] WebSocket endpoint for real-time status updates

### Milestone 3.2: Caching

- [ ] Cache LLM responses for identical CVs (hash-based)
- [ ] Redis cache with 1-hour TTL
- [ ] Cache static assets in frontend (already done in nginx)

### Milestone 3.4: Performance Optimization

- [ ] Add response compression (gzip)
- [ ] Database connection pooling
- [ ] LLM request timeout: 30s
- [ ] Load testing with k6 or locust (target: 100 concurrent users)

**Deliverable:** System handles 100+ concurrent users with sub-second response times

---

## 🎯 Phase 4: Security Hardening

**Goal:** Protect against common attacks (auth excluded)

### Milestone 4.1: Input Validation

- [ ] File type validation via magic bytes
- [ ] File size limit enforcement (10MB)
- [ ] PDF malware scanning (optional: `clamav`)
- [ ] Sanitize extracted text before LLM

### Milestone 4.2: Security Headers

- [ ] Add Content-Security-Policy to nginx config
- [ ] Add `Strict-Transport-Security` header
- [ ] Add `Permissions-Policy` header
- [ ] Test with securityheaders.com (target: A rating)

### Milestone 4.3: Secrets Management

- [ ] Move all secrets to environment variables
- [ ] Use `.env` files for development (gitignored)
- [ ] Docker secrets or Vault for production
- [ ] No secrets in docker-compose.yml

### Milestone 4.4: Dependency Security

- [ ] Run `pip-audit` and `npm audit`
- [ ] Set up Dependabot or Renovate
- [ ] Pin all dependency versions
- [ ] Monthly security review

**Deliverable:** No known vulnerabilities, A+ security headers rating

---

## 🎯 Phase 5: Developer Experience

**Goal:** Fast feedback loops and consistent code quality

### Milestone 5.1: Testing

- [ ] Unit tests for services (pytest)
- [ ] Integration tests for API endpoints
- [ ] Frontend component tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] Target: 80% code coverage

### Milestone 5.2: Pre-commit Hooks

- [ ] Install `pre-commit` framework
- [ ] Backend: `ruff` (lint), `black` (format), `mypy` (types)
- [ ] Frontend: `biome check`
- [ ] Auto-fix on commit where possible

### Milestone 5.3: Type Safety

- [ ] Add type hints to all backend functions
- [ ] Enable `mypy` strict mode
- [ ] Define Pydantic models for all API requests/responses
- [ ] No `Any` types in new code

### Milestone 5.4: Documentation

- [ ] API documentation with OpenAPI/Swagger (auto-generated)
- [ ] README with setup instructions
- [ ] CONTRIBUTING.md for developers
- [ ] Architecture diagram (Mermaid or Excalidraw)

**Deliverable:** Code quality gates pass on every commit

---

## 🎯 Phase 6: CI/CD & Deployment

### Milestone 6.3: Monitoring & Alerting

- [ ] Prometheus metrics endpoint
- [ ] Grafana dashboards (request rate, error rate, latency)
- [ ] Uptime monitoring (Uptime Kuma or Pingdom)
- [ ] Alert on: error rate >1%, latency p95 >2s, downtime

### Milestone 6.4: Production Deployment

- [ ] Kubernetes manifests or Docker Swarm config
- [ ] Horizontal Pod Autoscaler (CPU + memory)
- [ ] Pod Disruption Budget
- [ ] Resource limits and requests

**Deliverable:** One-command deployment with full monitoring

---

## 🎯 Phase 7: Production Polish

**Goal:** Professional user experience

### Milestone 7.1: Frontend Improvements

- [ ] Remove DevTools from production build
- [ ] Add meta tags (OG, Twitter cards)
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Loading skeletons instead of spinners

### Milestone 7.2: Error Pages

- [ ] Custom 404 page
- [ ] Custom 500 page
- [ ] User-friendly error messages with retry options
- [ ] Error tracking dashboard

### Milestone 7.3: Analytics

- [ ] Privacy-friendly analytics (Plausible or Umami)
- [ ] Track: uploads, completion rate, average processing time
- [ ] No PII collection, GDPR compliant

### Milestone 7.4: Legal & Compliance

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie consent (if using cookies)
- [ ] Data retention policy (auto-delete after 24h)

**Deliverable:** Production-ready application with professional UX

---

## 📊 Progress Tracking

| Phase | Milestones | Status | Target Date |
|-------|------------|--------|-------------|
| 1. Core Functionality | 4 | 🔴 Not Started | Week 1-2 |
| 2. Reliability | 4 | 🔴 Not Started | Week 3 |
| 3. Performance | 4 | 🔴 Not Started | Week 4-5 |
| 4. Security | 4 | 🔴 Not Started | Week 6 |
| 5. Developer Experience | 4 | 🔴 Not Started | Week 7 |
| 7. Production Polish | 4 | 🔴 Not Started | Week 9 |

---

## 🚀 Quick Start

```bash
# Development setup
git clone <repo>
cd cv-roaster
uv sync
bun install

# Run backend
cd backend
fastapi dev src/app.py

# Run frontend
cd frontend
bun run dev
```

---

## 📝 Definition of Done

A milestone is **complete** when:
- [ ] All checkboxes are marked
- [ ] Tests pass (if applicable)
- [ ] Code is reviewed and merged
- [ ] Documentation is updated
- [ ] Deployed to staging environment

---

*Last updated: 2026-03-09*
*Version: 1.0*
