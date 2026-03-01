# iBuild — Builder Command Centre

Construction project management SaaS. Vite + React single-page app with Express backend for AI features.

## Quick Start

```bash
npm install

# Terminal 1 — API server (port 3001)
npm run server

# Terminal 2 — Vite dev server (port 5173)
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Set on the **server** (not in `.env`). When present, Plans AI calls Anthropic for real floor plan analysis. When missing, the server returns stub data so the UI still works. |

```bash
# Live AI analysis
ANTHROPIC_API_KEY=sk-ant-... npm run server

# Stub mode (no key needed)
npm run server
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/floorplan/analyse` | Accepts `multipart/form-data` with a `file` field (image). Returns JSON with `total_m2`, `rooms`, `notes`, and `scope_items`. |

## Local Storage Keys

| Key | Shape | Description |
|---|---|---|
| `ib_projects` | `{ v: 1, projects: [...], ai: number }` | All projects + active index. Autosaved with 300ms debounce. |
| `ib_templates` | `[{ name, scope, margin, contingency }]` | Saved scope templates. |

## Architecture

- **Primary file:** `src/ibuild-command-centre.jsx` — entire app in one component
- **Server:** `server/index.js` — Express + cors + multer, proxies to Anthropic API
- **Entry:** `src/main.jsx` → `src/App.jsx` → `IBuild`
- **Storage:** `localStorage` via `store` wrapper (get/set/remove with JSON + try/catch)
- **Local-first** — all project data in browser storage, server only needed for AI features
