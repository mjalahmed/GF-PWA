# Architecture

## Overview

GarageFinder backend is a **Hono REST API** running on **Deno**, originally built for Supabase Edge Functions and adapted for **standalone container deployment** on Railway.

```text
┌─────────────┐     HTTPS      ┌──────────────────┐
│  PWA / App  │ ──────────────▶│  Railway API     │
│  (Netlify)  │   JWT + apikey │  (Deno + Hono)   │
└──────┬──────┘                └────────┬─────────┘
       │                                │
       │ Supabase Auth SDK              │ @supabase/supabase-js
       ▼                                ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (hosted)                         │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │ GoTrue   │  │ PostgREST  │  │ Storage buckets │  │
│  │ (Auth)   │  │ (DB API)   │  │ (files)         │  │
│  └──────────┘  └─────┬──────┘  └─────────────────┘  │
│                      │                               │
│               ┌──────▼──────┐                        │
│               │ PostgreSQL  │◀── Railway PG (target)│
│               └─────────────┘                        │
└─────────────────────────────────────────────────────┘
```

## Runtime coupling (read before deploying)

The API uses `@supabase/supabase-js` for **all database access**, not a direct Postgres driver. That means:

| Capability | Provided by |
|------------|-------------|
| SQL queries / RLS | Supabase PostgREST (`SUPABASE_URL/rest/v1`) |
| Login / JWT | Supabase Auth (`SUPABASE_URL/auth/v1`) |
| File uploads | Supabase Storage (`SUPABASE_URL/storage/v1`) |
| Schema migrations | Plain SQL via `psql` + `DATABASE_URL` |

**Railway PostgreSQL alone is not sufficient for runtime** until either:

1. Supabase PostgREST + Auth remain pointed at the same database (hybrid), or
2. Repositories are migrated to a direct Postgres client (future epic)

For the initial ~20 garage launch, keep Supabase Auth + Storage on the hosted Supabase project.

## API routes

Base path: `/v1` (standalone, `API_ROOT_PATH=""`)

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/health` | Liveness — no secrets |
| `GET /v1/health/ready` | Readiness — checks DB via Supabase client |
| `GET /v1/me` | Current user (auth required) |
| `GET /v1/discovery/businesses` | Public garage search |
| … | Full OpenAPI at `/v1/openapi.json` |

## Authentication

- Clients authenticate via **Supabase Auth** (email/password)
- API validates `Authorization: Bearer <access_token>` in Hono middleware
- Service-role key used server-side only for privileged operations
- No cookies — token-based, suitable for PWA

## CORS

Environment-driven allowlist (`ALLOWED_ORIGINS` or `CORS_ORIGIN`):

- Production: explicit origins only — **no `*`**
- Development: localhost PWA origins allowed by default

## Migrations

65 versioned SQL files in `supabase/migrations/`.

- Applied via `scripts/migrate.sh` using `DATABASE_URL`
- Tracked in `public.schema_migrations` table
- Forward-only — never edit applied migrations
- **Not** `prisma db push`

Migrations reference `auth.users`, `storage.buckets`, and `auth.uid()` — requires Supabase-compatible PostgreSQL schemas.

## What's intentionally excluded

| Component | Status |
|-----------|--------|
| Redis | Not used |
| Background workers | Not used |
| Scheduled jobs | Not used |
| Online payment webhooks | Stub only (`payment-webhook/`) |
| In-memory rate limiter | Exists but unwired |

## Portability path (future AWS migration)

The API is stateless. To migrate off Railway:

1. Export PostgreSQL from Railway
2. Run the same Docker image on ECS/Fargate
3. Point env vars at new database + Supabase (or replaced auth/storage)
4. No application rewrite required for container portability

Replacing Supabase Auth/Storage is a separate migration project.
