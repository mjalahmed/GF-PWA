# GarageFinder Backend

Production API for [GarageFinder](https://garagefinder.app) — Hono on Deno, PostgreSQL, Supabase Auth.

**Target deployment:** [Railway](https://railway.app) — 1 API service + 1 PostgreSQL database.

## Stack

| Layer | Technology |
|-------|------------|
| API | Hono 4 + Deno 2 |
| Database | PostgreSQL 15 (Railway) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Migrations | Versioned SQL (`supabase/migrations/`) |

## Quick start (local)

```bash
cp .env.example .env
# Fill SUPABASE_URL, keys, and optionally DATABASE_URL

deno run --config supabase/functions/deno.json --allow-env --allow-net --allow-read --watch src/main.ts
```

Health: http://127.0.0.1:8080/v1/health

## Scripts

| Command | Description |
|---------|-------------|
| `make serve` | Run API locally on `$PORT` |
| `make test` | Deno unit + contract tests |
| `make migrate` | Apply SQL migrations to `$DATABASE_URL` |
| `make smoke` | Health + auth smoke test |
| `make docker-build` | Build production image |

## Railway deployment

See [docs/RAILWAY.md](docs/RAILWAY.md) for step-by-step setup.

```text
GitHub → Railway → Build (Docker) → Migrate → Start → /v1/health
```

## API base URL

Standalone routes: `/v1/*` (no `/api` prefix).

Production target: `https://api.garagefinder.app`

PWA env var:

```text
VITE_GARAGEFINDER_API_URL=https://api.garagefinder.app
```

## Documentation

- [docs/RAILWAY.md](docs/RAILWAY.md) — Railway setup
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design & Supabase coupling
- [docs/DEPLOYMENT-REPORT.md](docs/DEPLOYMENT-REPORT.md) — production readiness report

## Security

- Never commit `.env` or service-role keys
- `ALLOWED_ORIGINS` required in production (no wildcard CORS)
- JWT validation in API middleware — not at the edge gateway
