#!/usr/bin/env bash
set -euo pipefail
BASE="${GARAGEFINDER_API_URL:-http://127.0.0.1:54321/functions/v1/api}"

echo "GET $BASE/v1/health"
curl -sf "$BASE/v1/health" | grep -q '"success":true'

echo "GET $BASE/v1/health/ready"
curl -sf "$BASE/v1/health/ready" | grep -q '"status":"ready"'

echo "GET $BASE/v1/openapi.json"
curl -sf "$BASE/v1/openapi.json" | grep -q '"openapi":"3.1.0"'

echo "GET $BASE/v1/docs"
curl -sf "$BASE/v1/docs" | grep -qi 'swagger'

echo "GET $BASE/v1/me without auth -> 401"
code=$(curl -s -o /tmp/gf_me.json -w "%{http_code}" "$BASE/v1/me")
test "$code" = "401"
grep -q 'AUTH_HEADER_MISSING' /tmp/gf_me.json

echo "GET $BASE/v1/me invalid token -> 401"
code=$(curl -s -o /tmp/gf_me_bad.json -w "%{http_code}" \
  -H "Authorization: Bearer invalid" "$BASE/v1/me")
test "$code" = "401"
grep -q 'AUTH_TOKEN_INVALID' /tmp/gf_me_bad.json

echo "Integration smoke checks passed."
