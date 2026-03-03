# iBuild — Builder Command Centre

Construction project management app with:
- React SPA frontend (Vite)
- Express backend
- Prisma/Postgres persistence
- Multi-tenant auth and integration-style APIs for Buildxact and Procore

## Quick Start

```bash
npm install
```

1) Start Postgres and configure `DATABASE_URL`.
2) Run Prisma migration:

```bash
npm run db:migrate
```

3) Run backend and frontend:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and set values:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key used for server encryption helpers |
| `JWT_SECRET` | Yes | JWT signing secret for `/api/register` + `/api/login` |
| `ANTHROPIC_API_KEY` | No | Enables live floor plan AI analysis |
| `PORT` | No | API port (default `3001`) |

## API Overview

### Auth
- `POST /api/register`
- `POST /api/login`

### Buildxact mode (JWT required)
- `GET /api/buildxact/projects`
- `POST /api/buildxact/projects`
- `GET /api/buildxact/estimates`
- `POST /api/buildxact/estimates`
- `GET /api/buildxact/invoices`
- `POST /api/buildxact/invoices`
- `POST /api/buildxact/documents` (`multipart/form-data`, field `file`)

### Procore mode (JWT required)
- `GET /api/procore/projects`
- `POST /api/procore/projects`
- `GET /api/procore/observations`
- `POST /api/procore/observations`
- `GET /api/procore/invoices`
- `POST /api/procore/invoices`
- `GET /api/procore/bills`
- `POST /api/procore/bills`

### Existing AI endpoint
- `POST /api/floorplan/analyse`

## Frontend Integration Mode

Projects list includes a source selector:
- `Local`
- `Buildxact`
- `Procore`

Mode is stored in localStorage (`ib_integration_mode`).  
JWT token for API requests is read from `ib_auth_token`.

## Testing

```bash
npm run test           # frontend unit tests
npm run test:server    # server tests
npm run test:integration
npm run build
```

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` runs:
- Prisma migrate deploy
- lint
- unit tests
- integration tests
- build
