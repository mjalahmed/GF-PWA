# GarageFinder PWA

Customer-facing Progressive Web App for [GarageFinder](https://garagefinder.app) — find trusted automotive services in Bahrain.

**Production URL:** https://app.garagefinder.app

## Stack

- **Vite** + **React 19** + **TypeScript**
- **React Router** — client-side routing with mobile shell
- **TanStack Query** — server state and caching
- **Supabase Auth** — sign-in / sign-up (JWT passed to API)
- **Tailwind CSS v4** — GarageFinder brand tokens
- **vite-plugin-pwa** — service worker, offline caching, install prompt

## Backend

This monorepo includes the GarageFinder API in `backend/` (Hono on Deno, deployable to Railway) plus the PWA client. The PWA talks to `/v1/*` endpoints with the user's Supabase JWT.

See [docs/backend-requirements.md](docs/backend-requirements.md) and [backend/docs/RAILWAY.md](backend/docs/RAILWAY.md) for CORS, env, and deployment.

## Customer features

| Area | Capabilities |
|------|----------------|
| **Discovery** | Home categories, featured/new garages, search with filters (category, open now, rating, vehicle, geo) |
| **Garages** | Detail with services/products/reviews tabs, favorites, book appointment |
| **Appointments** | List, detail, multi-step booking, cancel |
| **Commerce** | Invoices (view/approve, payments), quotations (view/accept/reject) |
| **Reviews** | Eligibilities, submit multi-dimension review, view responses |
| **Disputes** | Open dispute, messaging thread, withdraw |
| **Vehicles** | Full CRUD with make/model catalog |
| **Account** | Google sign-in, profile edit, roles |
| **PWA** | Install prompt, offline shell, service worker updates |

## Getting started

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project

npm install
npm run dev
```

Open http://localhost:5173

**Sign-in:** Google OAuth via Supabase — see [docs/google-auth.md](docs/google-auth.md) to enable the provider.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (PWA SW enabled in dev) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | Run Oxlint |

## Environment variables

Public client keys only — **never** put service-role keys in this app.

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_GARAGEFINDER_API_URL` | API base (defaults to `{SUPABASE_URL}/functions/v1/api`) |
| `VITE_APP_ENV` | `development` or `production` |

## PWA install

- **Android / Chrome:** Use the install banner or browser menu → Install app
- **iOS Safari:** Share → Add to Home Screen

The service worker caches static assets and uses network-first for HTML/API routes.

## Deployment

Build and deploy the `dist/` folder to Netlify at `app.garagefinder.app`.

Ensure the Supabase API CORS allowlist includes `https://app.garagefinder.app`.

**Remove the “Powered by Netlify” badge:** turn it **Off** in Netlify → Project configuration → General → Powered by Netlify badge. See [docs/netlify-deployment.md](docs/netlify-deployment.md). The repo also ships CSP headers that block the injected badge script.

```bash
npm run build
# Netlify publishes dist/ automatically when connected to this repo
```

## Project structure

```
src/
  app/           Router and providers
  components/    Layout shell, UI primitives
  hooks/         Auth, geolocation, PWA install, online status
  lib/           Env, Supabase client, utilities
  pages/         Route pages
  services/api/  Typed API client
  styles/        Tailwind + brand tokens
public/
  manifest.webmanifest
  icons/         PWA icons (192, 512, Apple touch)
```

## Security

- All sensitive API calls require network + valid JWT
- Only anon/public Supabase keys in client env
- Geolocation requested only on explicit user action ("Near me")
