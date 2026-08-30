# GarageFinder Backend — Railway Production Deployment Report

Generated as part of Railway production preparation.

---

## Backend stack

| Component | Detail |
|-----------|--------|
| Framework | Hono 4.6 |
| Runtime | Deno 2.1 |
| Package manager | Deno (`supabase/functions/deno.json`) |
| Database | PostgreSQL 15 |
| ORM | None — Supabase JS client + raw SQL migrations |
| Auth | Supabase Auth (JWT, validated in Hono middleware) |
| Storage | Supabase Storage buckets |
| Start command | `deno run --config supabase/functions/deno.json --allow-env --allow-net --allow-read src/main.ts` |
| Build | Docker (`Dockerfile`) |
| Health | `GET /v1/health` (liveness), `GET /v1/health/ready` (readiness) |

## Railway configuration

| Service | Purpose |
|---------|---------|
| `garagefinder-api` | Deno Hono API container |
| PostgreSQL plugin | Production database (`DATABASE_URL`) |

Files added:

- `Dockerfile` — production Deno image + `psql` for migrations
- `railway.toml` — build, health check, preDeploy migrate
- `.dockerignore`
- `scripts/migrate.sh`, `scripts/start.sh`, `scripts/smoke.sh`

## Environment variables (names only)

### Runtime (required)

- `APP_ENV`
- `PORT` (Railway auto-injects)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`
- `ALLOWED_ORIGINS` / `CORS_ORIGIN` (required in production)

### Optional

- `LOG_LEVEL`
- `API_ROOT_PATH` (default empty — routes at `/v1/*`)
- `DATABASE_URL` / `POSTGRES_URL` (Railway PostgreSQL)
- `GARAGEFINDER_API_URL` (smoke tests)

### Never expose to PWA

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## Database

| Item | Detail |
|------|--------|
| Migration count | 65 SQL files |
| Strategy | Forward-only via `scripts/migrate.sh` |
| Tracking | `public.schema_migrations` table |
| Production DB | **Fresh Railway PostgreSQL recommended** after Supabase schema bootstrap |
| Destructive ops | Blocked — no `db reset` in deploy pipeline |

**Important:** Migrations require Supabase `auth` and `storage` schemas. See `docs/RAILWAY.md` Option A/B.

## API

| Item | Value |
|------|-------|
| Production domain (target) | `https://api.garagefinder.app` |
| Interim | Railway-generated `*.up.railway.app` |
| Route prefix | `/v1/*` |

## PWA integration

Set in Netlify (or PWA host) production environment:

```text
VITE_GARAGEFINDER_API_URL=https://api.garagefinder.app
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_ENV=production
```

Development uses `http://127.0.0.1:8080` as API base when running locally.

## Security

| Control | Status |
|---------|--------|
| CORS | Env allowlist — no wildcard in production |
| Secrets in Git | `.gitignore` blocks `.env*` |
| JWT validation | Hono middleware |
| HTTPS | Required for production (Railway + custom domain) |
| Health endpoint | No secrets exposed |
| Logging | Structured JSON, sensitive fields redacted |
| Rate limiting | In-memory limiter exists but **not wired** |

## Deployment flow

```text
Developer push → main
       ↓
GitHub
       ↓
Railway webhook
       ↓
Docker build
       ↓
preDeploy: scripts/migrate.sh
       ↓
Start Deno on 0.0.0.0:$PORT
       ↓
Health check GET /v1/health
```

## Testing

| Test | Command | Status |
|------|---------|--------|
| Deno unit tests | `make test` | Available (requires Deno) |
| Smoke test | `make smoke` | Script ready |
| Docker build | `make docker-build` | Dockerfile ready |
| Production deploy | Manual via Railway | Pending user setup |

## Remaining issues

| # | Issue | Severity | Mitigation |
|---|-------|----------|------------|
| 1 | API uses Supabase JS, not direct Postgres | High | Keep Supabase Auth/PostgREST for runtime; use Railway PG for schema storage after bootstrap |
| 2 | Migrations need `auth`/`storage` schemas | High | Bootstrap from Supabase before applying migrations on Railway PG |
| 3 | File uploads use Supabase Storage | Medium | Documented follow-up — not blocking if Supabase Storage stays |
| 4 | Rate limiter not production-grade | Low | Acceptable for 200 customers |
| 5 | Payment webhook is stub | Low | Cash-only MVP |
| 6 | Railway project not yet created | Ops | User connects GitHub repo in Railway dashboard |
| 7 | Custom domain not configured | Ops | After smoke test on Railway URL |

## Audit summary (preparation changes)

Changes made to support Railway (no business logic changes):

1. Standalone entry `src/main.ts` — `0.0.0.0:$PORT`, SIGTERM graceful shutdown
2. `environment.ts` — `PORT`, `API_ROOT_PATH`, `CORS_ORIGIN` alias, `DATABASE_URL`
3. `application.factory.ts` — configurable `API_ROOT_PATH` (empty for standalone)
4. Docker + Railway config + migration script
5. Documentation

Existing functionality preserved. Authentication architecture unchanged.
