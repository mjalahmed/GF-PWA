# Railway deployment guide

## Target architecture

```text
Railway Project: GarageFinder
├── Service: garagefinder-api   (Docker / Deno)
└── Plugin: PostgreSQL            (DATABASE_URL auto-injected)
```

No Redis, queues, or extra workers for the initial launch (~20 garages / ~200 customers).

## Prerequisites

1. GitHub repository connected to Railway
2. Supabase project for **Auth + Storage** (JWT issuance, file uploads)
3. Domain plan: `api.garagefinder.app` (after smoke testing on Railway URL)

## Step 1 — Create Railway project

1. New Project → Deploy from GitHub → select `garagefinder-backend`
2. Add **PostgreSQL** plugin to the project
3. Railway injects `DATABASE_URL` into the API service

## Step 2 — Configure environment variables

Set these in Railway → Service → Variables (names only — never commit values):

| Variable | Purpose |
|----------|---------|
| `APP_ENV` | `production` |
| `NODE_ENV` | `production` (optional, for tooling) |
| `ALLOWED_ORIGINS` | `https://app.garagefinder.app,https://garagefinder.app` (+ dev origins if needed) |
| `LOG_LEVEL` | `info` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key (also sent as `apikey` header) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role |
| `DATABASE_URL` | Auto from PostgreSQL plugin |
| `PORT` | Auto-injected by Railway |

Do **not** expose service-role or database URLs to the PWA.

## Step 3 — Database bootstrap (important)

GarageFinder SQL migrations depend on Supabase schemas (`auth.users`, `storage.buckets`, `auth.uid()` RLS helpers).

**For initial production launch, choose one:**

### Option A — Recommended today

Use your **existing Supabase hosted PostgreSQL** connection string as `DATABASE_URL` until Railway PG is bootstrapped with compatible schemas. The API still requires `SUPABASE_URL` for Auth and Storage APIs.

### Option B — Fresh Railway PostgreSQL

1. Provision Railway PostgreSQL (empty)
2. Bootstrap Supabase-compatible schemas using Supabase CLI against the Railway connection string, **or** apply a one-time schema dump from a known-good Supabase project
3. Run `bash scripts/migrate.sh` (also runs automatically via `railway.toml` preDeploy)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for why plain PostgreSQL cannot run migrations without this bootstrap.

**Never** run `db reset` or destructive commands against production.

## Step 4 — Deploy

Railway builds from `Dockerfile` and runs:

1. `bash scripts/migrate.sh` (preDeploy — forward-only, tracked in `schema_migrations`)
2. Start Deno API on `0.0.0.0:$PORT`

Health check path: `/v1/health`

## Step 5 — Verify

```bash
export GARAGEFINDER_API_URL=https://your-service.up.railway.app
bash scripts/smoke.sh
```

Checklist:

- [ ] `/v1/health` → 200
- [ ] `/v1/health/ready` → 200 (database reachable via Supabase client)
- [ ] `/v1/me` without token → 401
- [ ] CORS preflight from PWA origin succeeds
- [ ] Sign-in from PWA works
- [ ] Discovery search returns data

## Step 6 — Custom domain

1. Railway → Settings → Custom Domain → `api.garagefinder.app`
2. Add DNS CNAME per Railway instructions
3. HTTPS is automatic
4. Update PWA production env:

```text
VITE_GARAGEFINDER_API_URL=https://api.garagefinder.app
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Deployment flow

```text
Push to main
    ↓
GitHub webhook
    ↓
Railway build (Dockerfile)
    ↓
preDeploy: scripts/migrate.sh
    ↓
Start: src/main.ts (Deno)
    ↓
Health: GET /v1/health
```

## Rollback

| Layer | Action |
|-------|--------|
| API | Redeploy previous Railway deployment |
| Database | Forward-only migrations — add a repair migration, never rewrite history |

## File uploads (follow-up)

Uploaded assets (garage images, vehicle photos, dispute evidence) use **Supabase Storage**, not the Railway filesystem. Object storage migration to S3/R2 is a future portability task — not required for initial launch if Supabase Storage remains in use.
