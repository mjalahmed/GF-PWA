#!/usr/bin/env bash
set -euo pipefail

API_BASE="${GARAGEFINDER_API_URL:-http://127.0.0.1:${PORT:-8080}}"
API_BASE="${API_BASE%/}"

echo "==> GET ${API_BASE}/v1/health"
curl -sfS "${API_BASE}/v1/health" | head -c 400
echo

echo "==> GET ${API_BASE}/v1/health/ready"
curl -sfS "${API_BASE}/v1/health/ready" | head -c 400
echo

code=$(curl -sS -o /tmp/gf-me.json -w "%{http_code}" "${API_BASE}/v1/me" || true)
echo "==> GET /v1/me without auth -> ${code} (expect 401)"
test "${code}" = "401" || { echo "FAIL: expected 401"; exit 1; }

echo "smoke OK"
