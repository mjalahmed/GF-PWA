/**
 * Integration checklist (requires running local Supabase + served api function).
 *
 * curl -s http://127.0.0.1:54321/functions/v1/api/v1/health
 * curl -s http://127.0.0.1:54321/functions/v1/api/v1/health/ready
 * curl -s -H "Authorization: Bearer invalid" .../v1/me  → 401
 * Valid token → GET /v1/me, GET/PATCH /v1/profiles/me
 *
 * Phase 2 authenticated onboarding acceptance:
 *   make backend:serve   # if not already running
 *   make onboarding:e2e
 */
export {};
