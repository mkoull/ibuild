# iBuild — Builder Command Centre

Construction project management SaaS. Vite + React single-page app.

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_FLOORPLAN_ANALYSE_ENDPOINT` | No | URL of a backend proxy that forwards floorplan images to an AI model for analysis. If not set, the "Plans AI" upload will show a toast prompting you to configure it. The client sends `POST { image: "<base64>", media_type: "image/png" }` and expects back the same response shape as the Anthropic Messages API. |

Example `.env`:
```
VITE_FLOORPLAN_ANALYSE_ENDPOINT=http://localhost:3001/api/analyse-plan
```

## Local Storage Keys

| Key | Shape | Description |
|---|---|---|
| `ib_projects` | `{ v: 1, projects: [...], ai: number }` | All projects + active index. Autosaved with 400ms debounce. |
| `ib_templates` | `[{ name, scope, margin, contingency }]` | Saved scope templates. |

## Architecture

- **Primary file:** `src/ibuild-command-centre.jsx` — entire app in one component
- **Entry:** `src/main.jsx` → `src/App.jsx` → `IBuild`
- **Storage:** `localStorage` via `store` wrapper (get/set/remove with JSON + try/catch)
- **No backend required** — fully local-first, all data in browser storage
