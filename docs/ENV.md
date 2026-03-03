# Environment Variables

## Frontend (Vite)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3001/api` | Backend API base URL |
| `VITE_FLOORPLAN_ANALYSE_ENDPOINT` | No | — | Anthropic-powered floorplan analysis endpoint |

## Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | HTTP server port |
| `DATABASE_URL` | **Yes** (prod) | — | Postgres connection string (e.g. `postgresql://user:pass@localhost:5432/ibuild`) |
| `JWT_SECRET` | **Yes** (prod) | — | Secret for signing JWT tokens |
| `ENCRYPTION_KEY` | **Yes** (prod) | — | 32-byte hex key for AES-256-GCM encryption |
| `ANTHROPIC_API_KEY` | No | — | API key for Anthropic Claude (floorplan analysis) |
| `NODE_ENV` | No | `development` | `development` or `production` |

## Notes

- In development, missing required vars log a warning but don't crash.
- In production, missing required vars throw on startup.
- The server loads `.env` from the project root automatically (no dotenv dependency).
- Frontend vars must be prefixed with `VITE_` to be exposed to the browser.
