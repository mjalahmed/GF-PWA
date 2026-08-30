#!/usr/bin/env bash
# Phase 2 business onboarding authenticated end-to-end acceptance test.
# Requires local Supabase + served `api` Edge Function.
# Uses well-known local demo keys only (never production credentials).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
# Local Supabase demo keys (public, committed in upstream Supabase docs).
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"

DB_HOST="${PGHOST:-127.0.0.1}"
DB_PORT="${PGPORT:-54322}"
DB_USER="${PGUSER:-postgres}"
DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

APPLICANT_EMAIL="applicant@garagefinder.test"
REVIEWER_EMAIL="reviewer@garagefinder.test"
UNAUTHORIZED_EMAIL="unauthorized@garagefinder.test"
TEST_PASSWORD="OnboardingE2E!local-only"

CR_NUMBER="E2E-PHASE2-CR-001"
DISPLAY_NAME="E2E Phase2 Garage"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

PASS_COUNT=0
FAIL_COUNT=0

log() { printf '\n==> %s\n' "$*"; }
ok() { printf '  PASS: %s\n' "$*"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { printf '  FAIL: %s\n' "$*" >&2; FAIL_COUNT=$((FAIL_COUNT + 1)); exit 1; }

expect_http() {
  local label="$1" actual="$2"
  shift 2
  local expected
  for expected in "$@"; do
    if [[ "$actual" == "$expected" ]]; then
      ok "$label (HTTP $actual)"
      return 0
    fi
  done
  fail "$label (expected HTTP $*, got $actual); body=$(head -c 400 "$TMP_DIR/api_body.json" 2>/dev/null || true)"
}

expect_denied() {
  local label="$1" code="$2"
  if [[ "$code" == "401" || "$code" == "403" || "$code" == "404" || "$code" == "409" ]]; then
    ok "$label (HTTP $code)"
  else
    fail "$label (expected denied 401/403/404/409, got $code)"
  fi
}

psql_q() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -At -c "$1"
}

api() {
  # api METHOD PATH TOKEN [BODY] [EXTRA_HEADER...]
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  shift 3 || true
  [[ $# -gt 0 ]] && shift || true
  local out="$TMP_DIR/api_body.json"
  local args=(-sS -o "$out" -w "%{http_code}" -X "$method" "$API_BASE$path" \
    -H "Content-Type: application/json" \
    -H "apikey: $ANON_KEY")
  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  local extra
  for extra in "$@"; do
    args+=(-H "$extra")
  done
  if [[ -n "$body" ]]; then
    args+=(-d "$body")
  elif [[ "$method" == "POST" || "$method" == "PATCH" || "$method" == "PUT" ]]; then
    args+=(-d '{}')
  fi
  local code
  code="$(curl "${args[@]}")"
  printf '%s' "$code"
}

json_get() {
  local expr="$1"
  # Avoid jq -e: boolean false / empty string are valid values but exit 1 under -e.
  local value
  value="$(jq -r "$expr" "$TMP_DIR/api_body.json")"
  if [[ "$value" == "null" ]]; then
    fail "JSON path missing: $expr; body=$(head -c 500 "$TMP_DIR/api_body.json")"
  fi
  printf '%s' "$value"
}

ensure_user() {
  local email="$1" full_name="$2"
  local list_json create_json
  list_json="$(curl -sS "$SUPABASE_URL/auth/v1/admin/users?page=1&per_page=200" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "apikey: $SERVICE_ROLE_KEY")"
  local user_id
  user_id="$(jq -r --arg email "$email" '
    (.users // []) | map(select(.email == $email)) | .[0].id // empty
  ' <<<"$list_json")"

  if [[ -z "$user_id" ]]; then
    create_json="$(curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg email "$email" --arg password "$TEST_PASSWORD" --arg name "$full_name" '{
        email: $email,
        password: $password,
        email_confirm: true,
        user_metadata: { full_name: $name }
      }')")"
    user_id="$(jq -er '.id' <<<"$create_json")"
  else
    curl -sS -X PUT "$SUPABASE_URL/auth/v1/admin/users/$user_id" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg password "$TEST_PASSWORD" '{password: $password, email_confirm: true}')" \
      >/dev/null
  fi
  printf '%s' "$user_id"
}

sign_in() {
  local email="$1"
  local resp
  resp="$(curl -sS -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg email "$email" --arg password "$TEST_PASSWORD" '{email:$email,password:$password}')")"
  jq -er '.access_token' <<<"$resp"
}

assign_role() {
  local user_id="$1" role_code="$2"
  psql_q "
    insert into public.user_roles (user_id, role_id, assigned_by)
    select '$user_id'::uuid, r.id, '$user_id'::uuid
    from public.roles r
    where r.code = '$role_code'
    on conflict (user_id, role_id) do nothing;
  " >/dev/null
}

cleanup_prior_e2e_data() {
  log "Cleaning prior Phase 2 e2e data for deterministic state"
  psql_q "
    do \$\$
    declare
      applicant_id uuid;
      app_ids uuid[];
      biz_ids uuid[];
    begin
      select id into applicant_id from auth.users where email = '$APPLICANT_EMAIL';
      if applicant_id is null then
        return;
      end if;

      select coalesce(array_agg(id), '{}'::uuid[])
      into app_ids
      from public.business_applications
      where applicant_user_id = applicant_id
         or commercial_registration_number = '$CR_NUMBER'
         or display_name = '$DISPLAY_NAME';

      select coalesce(array_agg(id), '{}'::uuid[])
      into biz_ids
      from public.businesses
      where source_application_id = any(app_ids)
         or commercial_registration_number = '$CR_NUMBER'
         or display_name = '$DISPLAY_NAME';

      delete from public.business_branches where business_id = any(biz_ids);
      delete from public.business_memberships where business_id = any(biz_ids);
      delete from public.businesses where id = any(biz_ids);

      delete from public.business_application_documents where application_id = any(app_ids);
      delete from public.business_application_reviews where application_id = any(app_ids);
      delete from public.business_application_steps where application_id = any(app_ids);
      delete from public.business_application_branches where application_id = any(app_ids);
      delete from public.notifications
        where entity_type = 'business_application' and entity_id = any(app_ids);
      delete from public.audit_logs
        where entity_type = 'business_application' and entity_id = any(app_ids);
      delete from public.business_applications where id = any(app_ids);

      delete from public.user_roles ur
      using public.roles r
      where ur.user_id = applicant_id
        and ur.role_id = r.id
        and r.code = 'business_owner';
    end
    \$\$;
  " >/dev/null
  ok "Prior e2e rows removed"
}

# --- Preconditions ---
log "Checking local API health"
health_code="$(curl -sS -o "$TMP_DIR/health.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
if [[ "$health_code" != "200" ]]; then
  fail "API not reachable at $API_BASE/v1/health (HTTP ${health_code:-none}). Run: make backend:start && make backend:serve"
fi
ok "API healthy"

psql_q "select 1" >/dev/null
ok "Database reachable"

# --- Users ---
log "Ensuring development users"
APPLICANT_ID="$(ensure_user "$APPLICANT_EMAIL" "E2E Applicant")"
REVIEWER_ID="$(ensure_user "$REVIEWER_EMAIL" "E2E Reviewer")"
UNAUTHORIZED_ID="$(ensure_user "$UNAUTHORIZED_EMAIL" "E2E Unauthorized")"
ok "Users ready (applicant=$APPLICANT_ID reviewer=$REVIEWER_ID unauthorized=$UNAUTHORIZED_ID)"

assign_role "$REVIEWER_ID" "onboarding_officer"
ok "Reviewer has onboarding_officer role"

cleanup_prior_e2e_data

APPLICANT_TOKEN="$(sign_in "$APPLICANT_EMAIL")"
REVIEWER_TOKEN="$(sign_in "$REVIEWER_EMAIL")"
UNAUTHORIZED_TOKEN="$(sign_in "$UNAUTHORIZED_EMAIL")"
ok "Access tokens acquired"

# Minimal valid PNG for storage upload
PNG_FILE="$TMP_DIR/doc.png"
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x01\x01\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82' >"$PNG_FILE"
FILE_SIZE="$(wc -c <"$PNG_FILE" | tr -d ' ')"

# --- Applicant flow ---
log "Applicant flow"
code="$(api GET /v1/business-categories "$APPLICANT_TOKEN")"
expect_http "List categories" "$code" 200
CATEGORY_ID="$(json_get '(.data | if type=="array" then .[0].id else (.categories[0].id // .[0].id) end)')"
ok "Category selected ($CATEGORY_ID)"

code="$(api GET "/v1/business-categories/$CATEGORY_ID/document-requirements" "$APPLICANT_TOKEN")"
expect_http "List document requirements" "$code" 200
cp "$TMP_DIR/api_body.json" "$TMP_DIR/requirements.json"
REQ_COUNT="$(jq -er '(.data | if type=="array" then . else .requirements // . end) | length' "$TMP_DIR/requirements.json")"
[[ "$REQ_COUNT" -ge 1 ]] || fail "Expected document requirements, got $REQ_COUNT"
ok "Requirements loaded ($REQ_COUNT)"

CREATE_BODY="$(jq -n \
  --arg categoryId "$CATEGORY_ID" \
  --arg cr "$CR_NUMBER" \
  --arg display "$DISPLAY_NAME" \
  '{
    businessCategoryId: $categoryId,
    legalName: "E2E Phase2 Garage W.L.L.",
    displayName: $display,
    description: "Authenticated Phase 2 acceptance business",
    commercialRegistrationNumber: $cr,
    phone: "+97317000001",
    email: "e2e-garage@garagefinder.test",
    website: "https://e2e.garagefinder.test"
  }')"
code="$(api POST /v1/business-applications "$APPLICANT_TOKEN" "$CREATE_BODY")"
expect_http "Create application" "$code" 200 201
APP_ID="$(json_get '.data.id // .data.application.id')"
ok "Application created ($APP_ID)"

UPDATE_BODY="$(jq -n '{
  description: "Updated description for Phase 2 e2e",
  currentStep: "branch_information"
}')"
code="$(api PATCH "/v1/business-applications/$APP_ID" "$APPLICANT_TOKEN" "$UPDATE_BODY")"
expect_http "Update business information" "$code" 200
ok "Business information updated"

BRANCH_BODY="$(jq -n '{
  name: "Primary Branch",
  phone: "+97317000002",
  email: "branch@garagefinder.test",
  addressLine: "Building 12, Road 45, Block 3",
  area: "Seef",
  city: "Manama",
  countryCode: "BH",
  latitude: 26.2361,
  longitude: 50.5350,
  timezone: "Asia/Bahrain"
}')"
code="$(api PATCH "/v1/business-applications/$APP_ID/branch" "$APPLICANT_TOKEN" "$BRANCH_BODY")"
expect_http "Add primary branch" "$code" 200
ok "Primary branch saved"

DOCUMENT_IDS=()
STORAGE_PATH=""
BUCKET="business-application-documents"
EXPIRES_AT="$(date -u -v+1y +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '+1 year' +%Y-%m-%dT%H:%M:%SZ)"
while IFS= read -r row; do
  req_id="$(jq -r '.id' <<<"$row")"
  doc_type="$(jq -r '.documentType // .document_type' <<<"$row")"
  needs_expiry="$(jq -r '.requiresExpiryDate // .requires_expiry_date // false' <<<"$row")"
  body_extra='{}'
  if [[ "$needs_expiry" == "true" ]]; then
    body_extra="$(jq -n --arg exp "$EXPIRES_AT" '{expiresAt:$exp}')"
  fi
  DOC_BODY="$(jq -n \
    --arg reqId "$req_id" \
    --argjson size "$FILE_SIZE" \
    --argjson extra "$body_extra" \
    '{
      documentRequirementId: $reqId,
      originalFileName: "e2e-doc.png",
      mimeType: "image/png",
      fileSizeBytes: $size
    } + $extra')"
  code="$(api POST "/v1/business-applications/$APP_ID/documents" "$APPLICANT_TOKEN" "$DOC_BODY")"
  expect_http "Register document ($doc_type)" "$code" 200 201
  DOC_ID="$(json_get '.data.document.id // .data.id')"
  STORAGE_PATH="$(json_get '.data.storagePath // .data.document.storagePath')"
  BUCKET="$(json_get '.data.bucket // "business-application-documents"')"
  DOCUMENT_IDS+=("$DOC_ID")

  upload_code="$(curl -sS -o "$TMP_DIR/upload.json" -w "%{http_code}" \
    -X POST "$SUPABASE_URL/storage/v1/object/$BUCKET/$STORAGE_PATH" \
    -H "Authorization: Bearer $APPLICANT_TOKEN" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: image/png" \
    -H "x-upsert: true" \
    --data-binary @"$PNG_FILE")"
  expect_http "Upload document bytes ($doc_type)" "$upload_code" 200
done < <(jq -c '(.data | if type=="array" then . else .requirements // . end)[]' "$TMP_DIR/requirements.json")
ok "All documents registered and uploaded (${#DOCUMENT_IDS[@]})"

code="$(api POST "/v1/business-applications/$APP_ID/submit" "$APPLICANT_TOKEN" "{}" \
  "Idempotency-Key: e2e-submit-$APP_ID")"
expect_http "Submit application" "$code" 200
STATUS="$(json_get '.data.status // .data.application.status')"
[[ "$STATUS" == "submitted" ]] || fail "Expected submitted status, got $STATUS"
ok "Application submitted"

# --- Authorization tests (while application is still submitted) ---
log "Authorization tests"
code="$(api POST "/v1/business-applications/$APP_ID/approve" "$APPLICANT_TOKEN" "{}" \
  "Idempotency-Key: e2e-applicant-approve-$APP_ID")"
expect_denied "Applicant approves own application" "$code"

code="$(api GET "/v1/business-applications/$APP_ID" "$UNAUTHORIZED_TOKEN")"
expect_denied "Unauthorized user reads application" "$code"

code="$(api PATCH "/v1/business-applications/$APP_ID" "$APPLICANT_TOKEN" \
  '{"description":"should fail"}')"
expect_denied "Applicant modifies submitted application" "$code"

# Public / unauthenticated storage access must fail
pub_code="$(curl -sS -o "$TMP_DIR/pub.json" -w "%{http_code}" \
  "$SUPABASE_URL/storage/v1/object/public/$BUCKET/$STORAGE_PATH" || true)"
anon_code="$(curl -sS -o "$TMP_DIR/anon.json" -w "%{http_code}" \
  "$SUPABASE_URL/storage/v1/object/$BUCKET/$STORAGE_PATH" \
  -H "apikey: $ANON_KEY" || true)"
if [[ "$pub_code" == "200" || "$anon_code" == "200" ]]; then
  fail "Public user accesses private document (public=$pub_code anon=$anon_code)"
fi
ok "Public user accesses private document (denied public=$pub_code anon=$anon_code)"

code="$(api POST "/v1/business-applications/$APP_ID/approve" "$UNAUTHORIZED_TOKEN" "{}" \
  "Idempotency-Key: e2e-unauth-approve-$APP_ID")"
expect_denied "Reviewer without permission approves" "$code"

# --- Reviewer flow ---
log "Reviewer flow"
ASSIGN_BODY="$(jq -n --arg rid "$REVIEWER_ID" '{reviewerId:$rid}')"
code="$(api POST "/v1/business-applications/$APP_ID/assign-reviewer" "$REVIEWER_TOKEN" "$ASSIGN_BODY")"
expect_http "Assign reviewer" "$code" 200
ok "Reviewer assigned"

code="$(api POST "/v1/business-applications/$APP_ID/start-review" "$REVIEWER_TOKEN" "{}")"
expect_http "Start review" "$code" 200
STATUS="$(json_get '.data.status')"
[[ "$STATUS" == "under_review" ]] || fail "Expected under_review, got $STATUS"
ok "Review started"

code="$(api GET "/v1/business-applications/$APP_ID/documents" "$REVIEWER_TOKEN")"
expect_http "List documents for review" "$code" 200
while IFS= read -r row; do
  doc_id="$(jq -r '.id' <<<"$row")"
  review_body='{"status":"approved"}'
  code="$(api POST "/v1/business-applications/$APP_ID/documents/$doc_id/review" "$REVIEWER_TOKEN" "$review_body")"
  expect_http "Approve document $doc_id" "$code" 200
done < <(jq -c '(.data | if type=="array" then . else .documents // . end)[]' "$TMP_DIR/api_body.json")
ok "All required documents approved"

code="$(api POST "/v1/business-applications/$APP_ID/approve" "$REVIEWER_TOKEN" "{}" \
  "Idempotency-Key: e2e-approve-$APP_ID")"
expect_http "Approve application" "$code" 200
BUSINESS_ID="$(json_get '.data.businessId')"
IDEMPOTENT_FLAG="$(json_get '.data.idempotent')"
[[ -n "$BUSINESS_ID" && "$BUSINESS_ID" != "null" ]] || fail "Missing businessId from approve"
[[ "$IDEMPOTENT_FLAG" == "false" ]] || fail "First approve should not be idempotent"
ok "Application approved (business=$BUSINESS_ID)"

# --- Idempotency ---
log "Idempotency: approve again"
code="$(api POST "/v1/business-applications/$APP_ID/approve" "$REVIEWER_TOKEN" "{}" \
  "Idempotency-Key: e2e-approve-again-$APP_ID")"
expect_http "Second approve call" "$code" 200
BUSINESS_ID_2="$(json_get '.data.businessId')"
IDEMPOTENT_2="$(json_get '.data.idempotent')"
[[ "$BUSINESS_ID_2" == "$BUSINESS_ID" ]] || fail "Second approve returned different business ($BUSINESS_ID_2)"
[[ "$IDEMPOTENT_2" == "true" ]] || fail "Second approve should set idempotent=true"
ok "Same business returned with idempotent=true"

BIZ_COUNT="$(psql_q "select count(*) from public.businesses where id = '$BUSINESS_ID' or source_application_id = '$APP_ID' or commercial_registration_number = '$CR_NUMBER';")"
BRANCH_COUNT="$(psql_q "select count(*) from public.business_branches where business_id = '$BUSINESS_ID' and is_primary = true;")"
MEMBER_COUNT="$(psql_q "select count(*) from public.business_memberships where business_id = '$BUSINESS_ID' and role = 'owner' and status = 'active';")"
ROLE_COUNT="$(psql_q "
  select count(*)
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = '$APPLICANT_ID' and r.code = 'business_owner';
")"
APPROVAL_REVIEW_COUNT="$(psql_q "select count(*) from public.business_application_reviews where application_id = '$APP_ID' and action = 'approved';")"
NOTIF_COUNT="$(psql_q "
  select count(*) from public.notifications
  where user_id = '$APPLICANT_ID'
    and type = 'business_application.approved'
    and entity_id = '$APP_ID';
")"
[[ "$BIZ_COUNT" == "1" ]] || fail "Duplicate business (count=$BIZ_COUNT)"
[[ "$BRANCH_COUNT" == "1" ]] || fail "Duplicate primary branch (count=$BRANCH_COUNT)"
[[ "$MEMBER_COUNT" == "1" ]] || fail "Duplicate owner membership (count=$MEMBER_COUNT)"
[[ "$ROLE_COUNT" == "1" ]] || fail "Duplicate business_owner role (count=$ROLE_COUNT)"
[[ "$APPROVAL_REVIEW_COUNT" == "1" ]] || fail "Duplicate approval review (count=$APPROVAL_REVIEW_COUNT)"
[[ "$NOTIF_COUNT" == "1" ]] || fail "Duplicate approval notification (count=$NOTIF_COUNT)"
ok "No duplicate approval side effects"

# --- Database state ---
log "Database state verification"
IFS='|' read -r B_STATUS B_VERIF B_SOURCE B_APP_STATUS B_CREATED B_APPROVED_AT <<<"$(psql_q "
  select
    b.status::text || '|' ||
    b.verification_status::text || '|' ||
    b.source_application_id::text || '|' ||
    a.status::text || '|' ||
    a.created_business_id::text || '|' ||
    coalesce(to_char(a.approved_at at time zone 'utc', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'), '')
  from public.businesses b
  join public.business_applications a on a.id = b.source_application_id
  where b.id = '$BUSINESS_ID';
")"
unset IFS

[[ "$B_STATUS" == "active" ]] || fail "business.status=$B_STATUS"
[[ "$B_VERIF" == "verified" ]] || fail "business.verification_status=$B_VERIF"
[[ "$B_SOURCE" == "$APP_ID" ]] || fail "business.source_application_id mismatch"
[[ "$B_APP_STATUS" == "approved" ]] || fail "application.status=$B_APP_STATUS"
[[ "$B_CREATED" == "$BUSINESS_ID" ]] || fail "application.created_business_id mismatch"
[[ -n "$B_APPROVED_AT" ]] || fail "application.approved_at is null"
ok "Business + application linkage and statuses"

OWNER_MEMBER="$(psql_q "
  select count(*) from public.business_memberships
  where business_id = '$BUSINESS_ID'
    and user_id = '$APPLICANT_ID'
    and role = 'owner'
    and status = 'active';
")"
[[ "$OWNER_MEMBER" == "1" ]] || fail "Expected exactly one active owner membership"
ok "Active owner membership for applicant (owner_user_id column N/A; ownership via membership)"

HAS_OWNER_COL="$(psql_q "
  select count(*) from information_schema.columns
  where table_schema='public' and table_name='businesses' and column_name='owner_user_id';
")"
if [[ "$HAS_OWNER_COL" == "1" ]]; then
  OWNER_UID="$(psql_q "select owner_user_id::text from public.businesses where id = '$BUSINESS_ID';")"
  [[ "$OWNER_UID" == "$APPLICANT_ID" ]] || fail "business.owner_user_id mismatch"
  ok "business.owner_user_id = applicant"
else
  ok "Schema uses membership ownership (no businesses.owner_user_id)"
fi

AUDIT_CREATED="$(psql_q "select count(*) from public.audit_logs where entity_id='$APP_ID' and action='business.application.created';")"
AUDIT_SUBMITTED="$(psql_q "select count(*) from public.audit_logs where entity_id='$APP_ID' and action='business.application.submitted';")"
AUDIT_ASSIGNED="$(psql_q "select count(*) from public.audit_logs where entity_id='$APP_ID' and action='business.application.reviewer_assigned';")"
AUDIT_STARTED="$(psql_q "select count(*) from public.audit_logs where entity_id='$APP_ID' and action='business.application.review_started';")"
AUDIT_APPROVED="$(psql_q "select count(*) from public.audit_logs where entity_id='$APP_ID' and action='business.application.approved';")"
[[ "$AUDIT_CREATED" -ge 1 ]] || fail "Missing created audit"
[[ "$AUDIT_SUBMITTED" -ge 1 ]] || fail "Missing submitted audit"
[[ "$AUDIT_ASSIGNED" -ge 1 ]] || fail "Missing reviewer_assigned audit"
[[ "$AUDIT_STARTED" -ge 1 ]] || fail "Missing review_started audit"
[[ "$AUDIT_APPROVED" -ge 1 ]] || fail "Missing approved audit"
ok "Required audit log records present"

log "Summary"
printf 'PASS checks: %s\n' "$PASS_COUNT"
printf 'Application: %s\n' "$APP_ID"
printf 'Business:    %s\n' "$BUSINESS_ID"
printf 'Applicant:   %s (%s)\n' "$APPLICANT_EMAIL" "$APPLICANT_ID"
printf 'Reviewer:    %s (%s)\n' "$REVIEWER_EMAIL" "$REVIEWER_ID"
echo "onboarding_e2e: PASS"
