#!/usr/bin/env bash
# Phase 3 business-management authenticated end-to-end acceptance test.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"

DB_HOST="${PGHOST:-127.0.0.1}"
DB_PORT="${PGPORT:-54322}"
DB_USER="${PGUSER:-postgres}"
DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

OWNER_EMAIL="bm-owner@garagefinder.test"
MANAGER_EMAIL="bm-manager@garagefinder.test"
STAFF_EMAIL="bm-staff@garagefinder.test"
UNRELATED_EMAIL="bm-unrelated@garagefinder.test"
TEST_PASSWORD="BusinessMgmtE2E!local-only"
SLUG="bm-e2e-garage"
CR_NUMBER="BM-E2E-CR-001"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
PASS_COUNT=0

log() { printf '\n==> %s\n' "$*"; }
ok() { printf '  PASS: %s\n' "$*"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { printf '  FAIL: %s\n' "$*" >&2; exit 1; }

expect_http() {
  local label="$1" actual="$2"; shift 2
  local expected
  for expected in "$@"; do
    if [[ "$actual" == "$expected" ]]; then ok "$label (HTTP $actual)"; return 0; fi
  done
  fail "$label (expected HTTP $*, got $actual); body=$(head -c 500 "$TMP_DIR/api_body.json" 2>/dev/null || true)"
}

expect_denied() {
  local label="$1" code="$2"
  if [[ "$code" == "401" || "$code" == "403" || "$code" == "404" || "$code" == "409" || "$code" == "422" ]]; then
    ok "$label (HTTP $code)"
  else
    fail "$label (expected denied, got $code)"
  fi
}

psql_q() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -At -c "$1"
}

api() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  shift 3 || true
  [[ $# -gt 0 ]] && shift || true
  local out="$TMP_DIR/api_body.json"
  local args=(-sS -o "$out" -w "%{http_code}" -X "$method" "$API_BASE$path" \
    -H "Content-Type: application/json" -H "apikey: $ANON_KEY")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  local extra
  for extra in "$@"; do args+=(-H "$extra"); done
  if [[ -n "$body" ]]; then args+=(-d "$body")
  elif [[ "$method" == "POST" || "$method" == "PATCH" || "$method" == "PUT" ]]; then args+=(-d '{}'); fi
  curl "${args[@]}"
}

json_get() {
  local value
  value="$(jq -r "$1" "$TMP_DIR/api_body.json")"
  [[ "$value" == "null" ]] && fail "JSON missing: $1; body=$(head -c 400 "$TMP_DIR/api_body.json")"
  printf '%s' "$value"
}

ensure_user() {
  local email="$1" name="$2"
  local list_json user_id
  list_json="$(curl -sS "$SUPABASE_URL/auth/v1/admin/users?page=1&per_page=200" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY")"
  user_id="$(jq -r --arg email "$email" '(.users // []) | map(select(.email==$email)) | .[0].id // empty' <<<"$list_json")"
  if [[ -z "$user_id" ]]; then
    user_id="$(curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg email "$email" --arg password "$TEST_PASSWORD" --arg name "$name" \
        '{email:$email,password:$password,email_confirm:true,user_metadata:{full_name:$name}}')" \
      | jq -er '.id')"
  else
    curl -sS -X PUT "$SUPABASE_URL/auth/v1/admin/users/$user_id" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg password "$TEST_PASSWORD" '{password:$password,email_confirm:true}')" >/dev/null
  fi
  printf '%s' "$user_id"
}

sign_in() {
  curl -sS -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
    -d "$(jq -n --arg email "$1" --arg password "$TEST_PASSWORD" '{email:$email,password:$password}')" \
    | jq -er '.access_token'
}

log "Checking API health"
code="$(curl -sS -o "$TMP_DIR/health.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
[[ "$code" == "200" ]] || fail "API not reachable. Run make backend:start && make backend:serve"
ok "API healthy"
psql_q "select 1" >/dev/null && ok "Database reachable"

log "Ensuring users"
OWNER_ID="$(ensure_user "$OWNER_EMAIL" "BM Owner")"
MANAGER_ID="$(ensure_user "$MANAGER_EMAIL" "BM Manager")"
STAFF_ID="$(ensure_user "$STAFF_EMAIL" "BM Staff")"
UNRELATED_ID="$(ensure_user "$UNRELATED_EMAIL" "BM Unrelated")"
ok "Users ready"

log "Seeding deterministic business for owner"
CATEGORY_ID="$(psql_q "select id from public.business_categories where code='garage' limit 1;")"
psql_q "
do \$\$
declare
  biz_id uuid;
  branch_id uuid;
begin
  delete from public.business_invitations where business_id in (select id from public.businesses where slug='$SLUG' or commercial_registration_number='$CR_NUMBER');
  delete from public.business_closure_dates where business_id in (select id from public.businesses where slug='$SLUG' or commercial_registration_number='$CR_NUMBER');
  delete from public.business_opening_hours where business_id in (select id from public.businesses where slug='$SLUG' or commercial_registration_number='$CR_NUMBER');
  delete from public.business_settings where business_id in (select id from public.businesses where slug='$SLUG' or commercial_registration_number='$CR_NUMBER');
  delete from public.business_branches where business_id in (select id from public.businesses where slug='$SLUG' or commercial_registration_number='$CR_NUMBER');
  delete from public.business_memberships where business_id in (select id from public.businesses where slug='$SLUG' or commercial_registration_number='$CR_NUMBER');
  delete from public.businesses where slug='$SLUG' or commercial_registration_number='$CR_NUMBER';

  insert into public.businesses (
    slug, business_category_id, legal_name, display_name, description,
    commercial_registration_number, phone, email, website,
    status, verification_status, approved_at, approved_by
  ) values (
    '$SLUG', '$CATEGORY_ID'::uuid, 'BM E2E Garage W.L.L.', 'BM E2E Garage',
    'Phase 3 business management e2e', '$CR_NUMBER', '+97317110001',
    'bm-e2e@garagefinder.test', 'https://bm-e2e.garagefinder.test',
    'active', 'verified', timezone('utc', now()), '$OWNER_ID'::uuid
  ) returning id into biz_id;

  insert into public.business_memberships (business_id, user_id, role, status, invited_by, accepted_at)
  values (biz_id, '$OWNER_ID'::uuid, 'owner', 'active', '$OWNER_ID'::uuid, timezone('utc', now()));

  insert into public.business_memberships (business_id, user_id, role, status, invited_by, accepted_at)
  values (biz_id, '$STAFF_ID'::uuid, 'staff', 'active', '$OWNER_ID'::uuid, timezone('utc', now()));

  insert into public.business_branches (
    business_id, name, phone, email, address_line, area, city, country_code, is_primary, is_active
  ) values (
    biz_id, 'Primary Branch', '+97317110002', 'branch@garagefinder.test',
    'Building 1, Road 1', 'Seef', 'Manama', 'BH', true, true
  ) returning id into branch_id;
end
\$\$;
" >/dev/null

BUSINESS_ID="$(psql_q "select id from public.businesses where slug='$SLUG';")"
PRIMARY_BRANCH_ID="$(psql_q "select id from public.business_branches where business_id='$BUSINESS_ID' and is_primary=true;")"
OWNER_MEMBERSHIP_ID="$(psql_q "select id from public.business_memberships where business_id='$BUSINESS_ID' and user_id='$OWNER_ID' and status='active';")"
STAFF_MEMBERSHIP_ID="$(psql_q "select id from public.business_memberships where business_id='$BUSINESS_ID' and user_id='$STAFF_ID' and status='active';")"
ok "Seeded business=$BUSINESS_ID primary=$PRIMARY_BRANCH_ID"

OWNER_TOKEN="$(sign_in "$OWNER_EMAIL")"
MANAGER_TOKEN="$(sign_in "$MANAGER_EMAIL")"
STAFF_TOKEN="$(sign_in "$STAFF_EMAIL")"
UNRELATED_TOKEN="$(sign_in "$UNRELATED_EMAIL")"
ok "Tokens acquired"

# --- Profile update ---
log "Business profile"
code="$(api PATCH "/v1/businesses/$BUSINESS_ID" "$OWNER_TOKEN" \
  '{"displayName":"BM E2E Garage Updated","description":"Updated by e2e"}')"
expect_http "Owner updates profile" "$code" 200

code="$(api PATCH "/v1/businesses/$BUSINESS_ID" "$OWNER_TOKEN" '{"legalName":"HACK"}')"
expect_denied "Protected legalName rejected" "$code"

code="$(api PATCH "/v1/businesses/$BUSINESS_ID" "$STAFF_TOKEN" '{"displayName":"Staff Hack"}')"
expect_denied "Staff edits profile denied" "$code"

code="$(api GET "/v1/businesses/$BUSINESS_ID" "$UNRELATED_TOKEN")"
expect_denied "Unrelated owner access denied" "$code"

# --- Branches ---
log "Branches"
code="$(api POST "/v1/businesses/$BUSINESS_ID/branches" "$OWNER_TOKEN" \
  '{"name":"Secondary Branch","addressLine":"Building 2","city":"Riffa","countryCode":"BH","phone":"+97317110003"}')"
expect_http "Create second branch" "$code" 200 201
SECOND_BRANCH_ID="$(json_get '.data.id')"

code="$(api POST "/v1/businesses/$BUSINESS_ID/branches/$SECOND_BRANCH_ID/make-primary" "$OWNER_TOKEN" "{}")"
expect_http "Make second branch primary" "$code" 200
PRIMARY_COUNT="$(psql_q "select count(*) from public.business_branches where business_id='$BUSINESS_ID' and is_primary and is_active;")"
[[ "$PRIMARY_COUNT" == "1" ]] || fail "Expected exactly one primary, got $PRIMARY_COUNT"
ok "Exactly one primary branch"

code="$(api DELETE "/v1/businesses/$BUSINESS_ID/branches/$SECOND_BRANCH_ID" "$OWNER_TOKEN")"
expect_denied "Cannot delete current primary without reassignment" "$code"

code="$(api POST "/v1/businesses/$BUSINESS_ID/branches/$PRIMARY_BRANCH_ID/make-primary" "$OWNER_TOKEN" "{}")"
expect_http "Restore original primary" "$code" 200

code="$(api DELETE "/v1/businesses/$BUSINESS_ID/branches/$SECOND_BRANCH_ID" "$OWNER_TOKEN")"
expect_http "Deactivate secondary branch" "$code" 200

# Recreate secondary for further tests
code="$(api POST "/v1/businesses/$BUSINESS_ID/branches" "$OWNER_TOKEN" \
  '{"name":"Secondary Branch 2","addressLine":"Building 3","city":"Muharraq","countryCode":"BH"}')"
expect_http "Create another branch" "$code" 200 201
SECOND_BRANCH_ID="$(json_get '.data.id')"

# --- Invitations ---
log "Invitations"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invitations" "$OWNER_TOKEN" \
  "{\"email\":\"$MANAGER_EMAIL\",\"role\":\"manager\",\"expiresInDays\":7}")"
expect_http "Invite manager" "$code" 200 201
INVITE_TOKEN="$(json_get '.data.token // .data.rawToken // .data.invitationToken')"
INVITE_ID="$(json_get '.data.id // .data.invitation.id')"

code="$(api POST "/v1/business-invitations/$INVITE_TOKEN/accept" "$UNRELATED_TOKEN" "{}")"
expect_denied "Wrong email cannot accept invite" "$code"

code="$(api POST "/v1/business-invitations/$INVITE_TOKEN/accept" "$MANAGER_TOKEN" "{}")"
expect_http "Manager accepts invite" "$code" 200
MANAGER_MEMBERSHIP_ID="$(psql_q "select id from public.business_memberships where business_id='$BUSINESS_ID' and user_id='$MANAGER_ID' and status='active';")"
[[ -n "$MANAGER_MEMBERSHIP_ID" ]] || fail "Manager membership missing"
ok "Manager membership active"

code="$(api GET "/v1/businesses/$BUSINESS_ID" "$MANAGER_TOKEN")"
expect_http "Manager reads business" "$code" 200

# --- Membership rules ---
log "Membership rules"
code="$(api PATCH "/v1/businesses/$BUSINESS_ID/members/$OWNER_MEMBERSHIP_ID" "$MANAGER_TOKEN" \
  '{"role":"staff"}')"
expect_denied "Manager cannot modify owner" "$code"

code="$(api POST "/v1/businesses/$BUSINESS_ID/members/$OWNER_MEMBERSHIP_ID/suspend" "$OWNER_TOKEN" "{}")"
expect_denied "Cannot suspend final owner" "$code"

code="$(api PATCH "/v1/businesses/$BUSINESS_ID/members/$STAFF_MEMBERSHIP_ID" "$MANAGER_TOKEN" \
  '{"role":"receptionist"}')"
expect_http "Manager updates staff role" "$code" 200

code="$(api POST "/v1/businesses/$BUSINESS_ID/members/$STAFF_MEMBERSHIP_ID/suspend" "$MANAGER_TOKEN" "{}")"
expect_http "Manager suspends staff" "$code" 200

code="$(api PATCH "/v1/businesses/$BUSINESS_ID" "$STAFF_TOKEN" '{"displayName":"Suspended Hack"}')"
expect_denied "Suspended staff cannot mutate" "$code"

code="$(api POST "/v1/businesses/$BUSINESS_ID/members/$STAFF_MEMBERSHIP_ID/restore" "$MANAGER_TOKEN" "{}")"
expect_http "Restore staff" "$code" 200

# --- Schedule ---
log "Opening hours and closures"
SCHEDULE='{"branchId":null,"schedule":[
  {"dayOfWeek":0,"isClosed":true,"opensAt":null,"closesAt":null},
  {"dayOfWeek":1,"isClosed":false,"opensAt":"09:00","closesAt":"17:00"},
  {"dayOfWeek":2,"isClosed":false,"opensAt":"09:00","closesAt":"17:00"},
  {"dayOfWeek":3,"isClosed":false,"opensAt":"09:00","closesAt":"17:00"},
  {"dayOfWeek":4,"isClosed":false,"opensAt":"09:00","closesAt":"17:00"},
  {"dayOfWeek":5,"isClosed":false,"opensAt":"09:00","closesAt":"13:00"},
  {"dayOfWeek":6,"isClosed":true,"opensAt":null,"closesAt":null}
]}'
code="$(api PUT "/v1/businesses/$BUSINESS_ID/opening-hours" "$OWNER_TOKEN" "$SCHEDULE")"
expect_http "Replace opening hours" "$code" 200

code="$(api POST "/v1/businesses/$BUSINESS_ID/closure-dates" "$OWNER_TOKEN" \
  '{"closureDate":"2026-12-25","reason":"Holiday","isFullDay":true}')"
expect_http "Create closure date" "$code" 200 201
CLOSURE_ID="$(json_get '.data.id')"

# --- Settings ---
log "Settings"
code="$(api PATCH "/v1/businesses/$BUSINESS_ID/settings" "$OWNER_TOKEN" \
  '{"reviewsEnabled":true,"currency":"BHD","locale":"en","timezone":"Asia/Bahrain","defaultAppointmentDurationMinutes":60}')"
expect_http "Update settings" "$code" 200

code="$(api GET "/v1/businesses/$BUSINESS_ID/settings" "$UNRELATED_TOKEN")"
expect_denied "Anonymous/unrelated settings denied" "$code"

# --- Public profile ---
log "Public profile"
code="$(api GET "/v1/businesses/$BUSINESS_ID/public" "")"
expect_http "Anonymous public read" "$code" 200
HAS_LEGAL="$(jq -r 'has("data") and (.data|has("legalName"))' "$TMP_DIR/api_body.json")"
HAS_EMAIL="$(jq -r '.data|has("email")' "$TMP_DIR/api_body.json")"
HAS_CR="$(jq -r '.data|has("commercialRegistrationNumber")' "$TMP_DIR/api_body.json")"
[[ "$HAS_LEGAL" == "false" ]] || fail "Public DTO leaked legalName"
[[ "$HAS_EMAIL" == "false" ]] || fail "Public DTO leaked email"
[[ "$HAS_CR" == "false" ]] || fail "Public DTO leaked CR"
ok "Public DTO field filtering"

# --- Audit ---
log "Audit records"
AUDIT_PROFILE="$(psql_q "select count(*) from public.audit_logs where action='business.updated' and (new_values->>'id'='$BUSINESS_ID' or metadata->>'business_id'='$BUSINESS_ID' or entity_id='$BUSINESS_ID');")"
AUDIT_INVITE="$(psql_q "select count(*) from public.audit_logs where action='business.invitation.created' and (metadata->>'business_id'='$BUSINESS_ID' or entity_id='$INVITE_ID');")"
AUDIT_HOURS="$(psql_q "select count(*) from public.audit_logs where action='business.opening_hours.updated' and (metadata->>'business_id'='$BUSINESS_ID' or entity_id='$BUSINESS_ID');")"
[[ "$AUDIT_PROFILE" -ge 1 ]] || fail "Missing business.updated audit"
[[ "$AUDIT_INVITE" -ge 1 ]] || fail "Missing invitation.created audit"
[[ "$AUDIT_HOURS" -ge 1 ]] || fail "Missing opening_hours.updated audit"
ok "Required audit records present"

log "Summary"
printf 'PASS checks: %s\n' "$PASS_COUNT"
printf 'Business: %s\n' "$BUSINESS_ID"
echo "business_management_e2e: PASS"
