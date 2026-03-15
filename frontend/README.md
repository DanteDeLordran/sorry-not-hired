# SorryNotHired Frontend 📱

> Chat-style UI for AI-powered CV roasting

**Framework:** TanStack Start (React 19 + TanStack Router)  
**Styling:** Tailwind CSS v4  
**Runtime:** Bun

---

## 🎯 What It Is

A phone-themed chat interface that simulates texting with an HR recruiter. Upload your CV and watch as "Sarah from HR" tears it apart in real-time.

**Features:**
- 📱 Phone-style chat UI with realistic messaging interface
- 💬 Typing indicators and streaming responses
- 📎 PDF file upload with preview
- 🎨 Custom HR recruiter persona with stats and mood meter
- ⚡ Real-time feedback streaming

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime)
- Backend API running (see [../README.md](../README.md))

### Development

```bash
# Install dependencies
bun install

# Run development server (port 3000)
bun run dev

# Preview production build
bun run preview
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BASE_URL` | Backend API URL | `http://localhost:8000` |

Create a `.env` file:
```bash
VITE_BASE_URL=http://localhost:8000
```

---

## 📦 Build for Production

```bash
# Build
bun run build

# Output: dist/
```

---

## 🧪 Testing

```bash
# Run tests
bun run test

# Watch mode
bun run test --watch
```

---

## 🎨 Code Quality

```bash
# Format code
bun run format

# Lint code
bun run lint

# Check (format + lint)
bun run check
```

---

## 🏗️ Architecture

### Component Structure

```
src/
├── components/
│   └── ChatPhone.tsx      # Main chat interface component
├── models/
│   └── roast.ts           # TypeScript types for API responses
├── routes/
│   ├── __root.tsx         # Root layout with HTML structure
│   └── index.tsx          # Home page (chat UI)
├── main.tsx               # Application entry point
├── router.tsx             # TanStack Router configuration
└── routeTree.gen.ts       # Auto-generated route tree
```

### Key Components

**ChatPhone** (`src/components/ChatPhone.tsx`)
- Main chat interface with phone frame design
- Handles file upload, message display, and API communication
- Streaming response with typing indicators
- HR recruiter sidebar with stats and mood meter

**UI Elements:**
- HR ID card with recruiter persona
- Patience level meter (animated)
- CV queue counter
- Rejection probability meter
- Recent activity feed

---

## 🎨 Styling

This project uses **Tailwind CSS v4** with custom CSS for the phone/chat styling.

### Custom CSS Scopes

The chat phone UI uses a custom CSS scope (`.chatphone-scope`) for isolated styling. Key classes:

| Class | Purpose |
|-------|---------|
| `.chatphone-scope` | Root scope for all styles |
| `.phone-container` | iPhone frame wrapper |
| `.chat-messages` | Message scroll area |
| `.bubble-row` | Individual message rows |
| `.chat-input-area` | File upload and send controls |

---

## 📡 API Integration

### Roast Endpoint

```typescript
POST /api/v1/chat/message
Content-Type: multipart/form-data

Request:
  file: File (PDF)

Response:
{
  roast: string;
  filename: string;
  severity: "light" | "medium" | "harsh";
}
```

### Type Definition

```typescript
// src/models/roast.ts
export interface RoastResponse {
  roast: string;
  filename: string;
  severity: "light" | "medium" | "harsh";
}
```

---

## 🛠️ Development

### Adding New Routes

TanStack Router uses file-based routing. Add a new route by creating a file:

```bash
# Create new route
touch src/routes/about.tsx
```

```tsx
// src/routes/about.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutComponent,
});

function AboutComponent() {
  return <div>About page</div>;
}
```

### Using the Layout

The root layout is in `src/routes/__root.tsx`. Add global elements there:

```tsx
// src/routes/__root.tsx
export const Route = createRootRoute({
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* Add header, footer, etc. */}
        {children}
        <Scripts />
      </body>
    </html>
  ),
});
```

### Server Functions

For server-side operations (if needed):

```tsx
import { createServerFn } from "@tanstack/react-start";

const fetchData = createServerFn({ method: "GET" }).handler(async () => {
  return { data: "from server" };
});
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `@tanstack/react-router` | File-based routing |
| `@tanstack/react-start` | Server functions, data loading |
| `react` / `react-dom` | UI framework (v19) |
| `tailwindcss` | Utility-first CSS (v4) |
| `lucide-react` | Icon library |
| `vitest` | Testing framework |
| `@biomejs/biome` | Linting and formatting |

---

## 🐳 Docker

Build and run with Docker Compose from the project root:

```bash
cd ..
docker compose up --build
```

Frontend available at: `http://localhost:80`

---

## 📝 Notes

### Demo Files
Files prefixed with `demo` can be safely removed.

### File Upload
- Only PDF files are accepted
- File is sent directly to the backend API
- No client-side processing or storage

### Response Streaming
The roast response is split into paragraphs and streamed with delays to simulate typing:

```typescript
const roastChunks = data.roast.split(/\n\n+/);
for (const chunk of roastChunks) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  // Add message to chat
}
```

---

## 📚 Learn More

- [TanStack Router Docs](https://tanstack.com/router)
- [TanStack Start Docs](https://tanstack.com/start)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Biome JS](https://biomejs.dev/)

---

*Built with 💅 and sarcasm*
