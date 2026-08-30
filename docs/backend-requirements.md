# Backend requirements for GarageFinder PWA

The PWA at `https://app.garagefinder.app` consumes the existing Supabase Edge Function API. No new backend service is required, but the following configuration is needed for production.

## CORS

Add the PWA origin to the API CORS allowlist:

```
https://app.garagefinder.app
```

For local development, also allow:

```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:8080
```

When the API runs on Railway, set `ALLOWED_ORIGINS` on the backend service (see `garagefinder-backend/docs/RAILWAY.md`).

## Production API URL

Point the PWA at the Railway-deployed API:

```
VITE_GARAGEFINDER_API_URL=https://api.garagefinder.app
```

Use the Railway-generated URL for initial smoke testing before the custom domain is configured.

The API should continue to require a valid JWT (`Authorization: Bearer …`) for protected routes. Public discovery endpoints (`/v1/discovery/*`) remain accessible with the anon key.

## Authentication

- Sign-in/sign-up uses **Supabase Auth** directly from the client
- API requests attach the user's access token automatically
- Token refresh is handled by the Supabase client and retried once on 401

## Push notifications (future)

When implementing web push for booking reminders:

1. Store web push subscriptions linked to user profiles
2. Expose `POST /v1/me/push-subscriptions` to register/unregister endpoints
3. Use VAPID keys server-side only — never expose private keys to the PWA
4. Send notifications from a server/worker, not from the client

## Geolocation / discovery

- `/v1/discovery/businesses` accepts optional `latitude` and `longitude` query params
- Sort by `distance` when coordinates are provided
- Geolocation is requested only when the user taps **Near me** (no background tracking)

## Rate limiting

The PWA uses standard REST calls with `X-Request-ID` on every request. Existing rate limits apply. Consider separate limits for unauthenticated discovery vs authenticated booking flows.

## Health check

No dedicated health endpoint is required for the PWA. Monitor the Supabase Edge Function and Auth service uptime.

## Deployment checklist

- [ ] CORS includes `https://app.garagefinder.app`
- [ ] Supabase anon key is set in PWA env (production project)
- [ ] JWT expiry and refresh settings are compatible with PWA session persistence
- [ ] Discovery API returns camelCase or snake_case consistently (client maps both)
