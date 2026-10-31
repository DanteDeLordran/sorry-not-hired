# SorryNotHired Roadmap

Last updated: October 30, 2026.

## Direction

Grow SorryNotHired into a public entertainment app. The next release will let people share their chat with Karen through a link to a read-only page.

Version `1.0.0` is the current baseline. The milestones below describe planned work; they do not change the application version or commit to release dates.

## 1.0.0 — Current Baseline

The core experience is implemented: PDF CV upload and validation, text extraction, a streamed Karen roast, and fallback messages when generation fails. The app supports OpenAI-compatible providers, a responsive chat interface, bounded processing, and Docker deployment through Caddy or Coolify.

There is no database or persistent conversation storage. Uploaded PDFs are temporary and deleted after processing; chat state lives in the current browser page.

Automated tests and local Docker checks cover the core flow. Public-server verification remains pending:

- [ ] Deploy the selected Git revision to the target production server.
- [ ] Verify public DNS, certificates, HTTP-to-HTTPS redirects, HSTS, and container health.
- [ ] Upload a representative CV through the public domain and confirm provider generation and streaming.

See the [deployment guide](README.md#coolify-single-compose-file) for setup and verification commands.

## 1.1.0 — Read-Only Chat Sharing

**Goal:** Let someone share a completed chat through a unique link that another person can open without uploading a CV or generating a new roast.

The sharing implementation is merged into the `dev` branch. Package versions remain `1.0.0` while release verification continues.

### Sharing Experience

- [x] Add a share action once a roast has finished streaming.
- [x] Let the sender review what will be shared and copy its link.
- [x] Include the visible chat messages in their original order, preserving the conversation's presentation.
- [x] Exclude the PDF, extracted CV text, original filename, and attachment metadata. Represent the upload with a generic “CV uploaded” placeholder.
- [x] Keep Karen's roast as written, including any CV details quoted in her response; make that visible in the sharing preview.
- [x] Open shared links in a responsive, read-only view with no upload, send, reset, or regeneration controls for that conversation.
- [x] Give recipients a way to start their own separate roast.

### Sharing Without Server Storage

- [x] Generate a self-contained link in the browser, carrying the shared messages in the URL fragment rather than a server-side snapshot.
- [x] Reconstruct and display the shared chat entirely in the recipient's browser, without sending the message payload to the backend or calling the model API.
- [x] Enforce an 8,000-character URL limit, a 64 KiB decoded JSON limit, 100 messages, and 16,000 JavaScript string characters per message. Explain oversized chats without silently truncating them.
- [x] Handle invalid, damaged, or unsupported links with a clear error state.
- [x] Keep shared chats and ordinary chat history out of server storage. Retaining PDFs or conversations for analytics is outside this roadmap.

A shared link carries the conversation itself. Anyone with the link can read that content; read-only viewing does not verify its authorship or make the link revocable.

### Release Criteria

- [x] A copied link opens the same shared messages in a fresh browser session after the sender closes or resets their original chat.
- [x] Recipients can read the conversation on desktop and mobile without changing it or triggering generation.
- [x] Shared payloads exclude the PDF, extracted CV text, filename, and attachment metadata, and are not sent to or stored by the backend.
- [x] Link decoding enforces size limits and renders message content safely as text.
- [x] Verify link creation, copy feedback, browser reconstruction, and invalid or oversized link handling.
- [x] Document how sharing works and its content and link-length limits.
- [ ] Verify link handling in Firefox and Safari and through the intended messaging and social sharing channels before release.

Local verification covers Bun regression tests and Chromium browser checks at desktop and mobile viewport sizes. Browser checks use a mocked roast response; live-provider and production-domain checks remain separate release work.

## 1.2.0 — Open

Define this milestone after feedback from `1.1.0` shows what people need from sharing. No features or release date are committed yet.

## Beyond 1.2.0 — Open

Choose later milestones as the public app develops. Keep the roadmap focused on confirmed priorities rather than speculative features.
