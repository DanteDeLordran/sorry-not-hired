# SorryNotHired Roadmap

Last updated: October 26, 2026.

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

### Sharing Experience

- [ ] Add a share action once a roast has finished streaming.
- [ ] Let the sender review what will be shared and copy its link.
- [ ] Include the visible chat messages in their original order, preserving the conversation's presentation.
- [ ] Exclude the PDF, extracted CV text, original filename, and attachment metadata. Represent the upload with a generic “CV uploaded” placeholder.
- [ ] Keep Karen's roast as written, including any CV details quoted in her response; make that visible in the sharing preview.
- [ ] Open shared links in a responsive, read-only view with no upload, send, reset, or regeneration controls for that conversation.
- [ ] Give recipients a way to start their own separate roast.

### Sharing Without Server Storage

- [ ] Generate a self-contained link in the browser, carrying the shared messages in the URL fragment rather than a server-side snapshot.
- [ ] Reconstruct and display the shared chat entirely in the recipient's browser, without sending the message payload to the backend or calling the model API.
- [ ] Define and verify payload and URL-length limits for supported browsers and sharing channels. If a chat is too large, explain the limit without silently truncating it.
- [ ] Handle invalid, damaged, or unsupported links with a clear error state.
- [ ] Keep shared chats and ordinary chat history out of server storage. Retaining PDFs or conversations for analytics is outside this roadmap.

A shared link carries the conversation itself. Anyone with the link can read that content; read-only viewing does not verify its authorship or make the link revocable.

### Release Criteria

- [ ] A copied link opens the same shared messages in a fresh browser session after the sender closes or resets their original chat.
- [ ] Recipients can read the conversation on desktop and mobile without changing it or triggering generation.
- [ ] Shared payloads exclude the PDF, extracted CV text, filename, and attachment metadata, and are not sent to or stored by the backend.
- [ ] Link decoding enforces size limits and renders message content safely as text.
- [ ] Verify link creation, copy feedback, browser reconstruction, and invalid or oversized link handling.
- [ ] Document how sharing works and its content and link-length limits.

## 1.2.0 — Open

Define this milestone after feedback from `1.1.0` shows what people need from sharing. No features or release date are committed yet.

## Beyond 1.2.0 — Open

Choose later milestones as the public app develops. Keep the roadmap focused on confirmed priorities rather than speculative features.
