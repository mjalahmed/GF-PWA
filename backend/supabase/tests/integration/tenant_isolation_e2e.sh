#!/usr/bin/env bash
# Cross-tenant checks against a running local API and Postgres.
# Owner A must not read or change business B. Customer A must not read customer B.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-http://127.0.0.1:8080}"
ANON_KEY="${SUPABASE_ANON_KEY:-}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
DB_HOST="${PGHOST:-127.0.0.1}"
DB_PORT="${PGPORT:-54322}"
DB_USER="${PGUSER:-postgres}"
DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

if [[ -z "$ANON_KEY" || -z "$SERVICE_ROLE_KEY" ]]; then
  echo "SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required" >&2
  exit 1
fi

TEST_PASSWORD="TenantIsoE2E!local"
SLUG_A="tenant-iso-garage-a"
SLUG_B="tenant-iso-garage-b"
CR_A="TI-ISO-CR-A"
CR_B="TI-ISO-CR-B"
RUN_ID="$(date +%s)-$$"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
PASS=0

log() { printf '\n==> %s\n' "$*"; }
ok() { printf '  PASS: %s\n' "$*"; PASS=$((PASS + 1)); }
fail() { printf '  FAIL: %s\n' "$*" >&2; exit 1; }

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
  fail "$label expected $* got $actual body=$(head -c 500 "$TMP/body.json")"
}

expect_denied() {
  local label="$1" code="$2"
  if [[ "$code" == "401" || "$code" == "403" || "$code" == "404" ]]; then
    ok "$label (HTTP $code)"
  else
    fail "$label expected denial, got $code body=$(head -c 500 "$TMP/body.json")"
  fi
}

psql_q() {
  local result
  result="$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -qAt -c "$1")"
  printf '%s' "${result%%$'\n'*}"
}

rls_count() {
  local uid="$1" query="$2"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -qAt <<SQL
begin;
set local role authenticated;
do \$\$ begin perform set_config('request.jwt.claim.sub', '${uid}', true); end \$\$;
${query}
rollback;
SQL
}

api() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  shift 3 || true
  [[ $# -gt 0 ]] && shift || true
  local args=(-sS -o "$TMP/body.json" -w "%{http_code}" -X "$method" "$API_BASE$path" \
    -H "Content-Type: application/json" -H "apikey: $ANON_KEY")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  local extra
  for extra in "$@"; do args+=(-H "$extra"); done
  if [[ -n "$body" ]]; then
    args+=(-d "$body")
  elif [[ "$method" == "POST" || "$method" == "PATCH" || "$method" == "PUT" ]]; then
    args+=(-d '{}')
  fi
  curl "${args[@]}"
}

ensure_user() {
  local email="$1" name="$2" list id
  list="$(curl -sS "$SUPABASE_URL/auth/v1/admin/users?page=1&per_page=200" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY")"
  id="$(jq -r --arg e "$email" '(.users // []) | map(select(.email == $e))[0].id // empty' <<<"$list")"
  if [[ -z "$id" ]]; then
    id="$(curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg e "$email" --arg p "$TEST_PASSWORD" --arg n "$name" \
        '{email:$e,password:$p,email_confirm:true,user_metadata:{full_name:$n}}')" | jq -er '.id')"
  else
    curl -sS -X PUT "$SUPABASE_URL/auth/v1/admin/users/$id" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg p "$TEST_PASSWORD" '{password:$p,email_confirm:true}')" >/dev/null
  fi
  printf '%s' "$id"
}

sign_in() {
  curl -sS -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
    -d "$(jq -n --arg e "$1" --arg p "$TEST_PASSWORD" '{email:$e,password:$p}')" | jq -er '.access_token'
}

assign_role() {
  psql_q "insert into public.user_roles (user_id, role_id, assigned_by)
    select '$1'::uuid, r.id, '$1'::uuid from public.roles r where r.code = '$2'
    on conflict do nothing;" >/dev/null
}

rest_ids() {
  local token="$1" path="$2"
  curl -sS "$SUPABASE_URL/rest/v1/$path" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $token" \
    -H "Accept: application/json"
}

log "Health"
code="$(curl -sS -o "$TMP/body.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
[[ "$code" == "200" ]] || fail "API not healthy ($code)"
ok "API healthy"

OWNER_A="$(ensure_user "ti-owner-a@garagefinder.test" "Owner A")"
OWNER_B="$(ensure_user "ti-owner-b@garagefinder.test" "Owner B")"
MANAGER_A="$(ensure_user "ti-manager-a@garagefinder.test" "Manager A")"
STAFF_B="$(ensure_user "ti-staff-b@garagefinder.test" "Staff B")"
CUSTOMER_A="$(ensure_user "ti-customer-a@garagefinder.test" "Customer A")"
CUSTOMER_B="$(ensure_user "ti-customer-b@garagefinder.test" "Customer B")"
assign_role "$OWNER_A" "business_owner"
assign_role "$STAFF_B" "business_staff"

CAT="$(psql_q "select id from public.business_categories where code = 'garage' limit 1;")"
PRD_CAT="$(psql_q "select id from public.product_categories where code = 'engine_oil' limit 1;")"
[[ -n "$CAT" && -n "$PRD_CAT" ]] || fail "missing seed categories"

log "Seed two garages"
psql_q "
delete from public.dispute_evidence where dispute_id in (
  select id from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'))
);
delete from public.dispute_messages where dispute_id in (
  select id from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'))
);
delete from public.dispute_status_history where dispute_id in (
  select id from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'))
);
delete from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'));
delete from public.invoices where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'));
delete from public.appointments where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'));
delete from public.products where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'));
delete from public.business_memberships where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'));
delete from public.business_branches where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'));
delete from public.businesses where slug in ('$SLUG_A','$SLUG_B') or commercial_registration_number in ('$CR_A','$CR_B');
delete from public.vehicles where customer_id in ('$CUSTOMER_A'::uuid, '$CUSTOMER_B'::uuid);
" >/dev/null

psql_q "
insert into public.businesses (
  slug, business_category_id, legal_name, display_name, description,
  commercial_registration_number, phone, email, status, verification_status, approved_at
) values
  ('$SLUG_A', '$CAT'::uuid, 'Tenant Iso A WLL', 'Tenant Iso Garage A', 'isolation fixture', '$CR_A', '+97317000001', 'a@garagefinder.test', 'active', 'verified', now()),
  ('$SLUG_B', '$CAT'::uuid, 'Tenant Iso B WLL', 'Tenant Iso Garage B', 'isolation fixture', '$CR_B', '+97317000002', 'b@garagefinder.test', 'active', 'verified', now());
insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
select id, '$OWNER_A'::uuid, 'owner', 'active', now() from public.businesses where slug = '$SLUG_A';
insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
select id, '$MANAGER_A'::uuid, 'manager', 'active', now() from public.businesses where slug = '$SLUG_A';
insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
select id, '$OWNER_B'::uuid, 'owner', 'active', now() from public.businesses where slug = '$SLUG_B';
insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
select id, '$STAFF_B'::uuid, 'staff', 'active', now() from public.businesses where slug = '$SLUG_B';
insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
select id, 'Main', 'Road 1', 'Manama', 'Seef', 'BH', 26.23, 50.58, true, true from public.businesses where slug in ('$SLUG_A','$SLUG_B');
update public.business_settings
set quotations_enabled = true, invoices_enabled = true, appointments_enabled = true
where business_id in (select id from public.businesses where slug in ('$SLUG_A','$SLUG_B'));
" >/dev/null

BIZ_A="$(psql_q "select id from public.businesses where slug = '$SLUG_A';")"
BIZ_B="$(psql_q "select id from public.businesses where slug = '$SLUG_B';")"
BRANCH_A="$(psql_q "select id from public.business_branches where business_id = '$BIZ_A' and is_primary;")"
BRANCH_B="$(psql_q "select id from public.business_branches where business_id = '$BIZ_B' and is_primary;")"

VEHICLE_B="$(psql_q "insert into public.vehicles (customer_id, make_text, model_text, year) values ('$CUSTOMER_B'::uuid, 'Toyota', 'Corolla', 2020) returning id;")"
APPT_B="$(psql_q "insert into public.appointments (customer_id, business_id, branch_id, vehicle_id, status, scheduled_start, scheduled_end)
  values ('$CUSTOMER_B'::uuid, '$BIZ_B'::uuid, '$BRANCH_B'::uuid, '$VEHICLE_B'::uuid, 'requested', now() + interval '2 days', now() + interval '2 days 1 hour')
  returning id;")"
INV_B="$(psql_q "insert into public.invoices (
  invoice_number, customer_id, business_id, branch_id, appointment_id, status,
  subtotal, discount_total, tax_total, platform_fee_total, grand_total, paid_total, remaining_total, created_by
) values (
  'TI-$RUN_ID', '$CUSTOMER_B'::uuid, '$BIZ_B'::uuid, '$BRANCH_B'::uuid, '$APPT_B'::uuid, 'issued',
  25, 0, 0, 0, 25, 0, 25, '$OWNER_B'::uuid
) returning id;")"
DSP_B="$(psql_q "insert into public.disputes (
  dispute_number, opened_by, opened_by_type, customer_id, business_id, appointment_id, invoice_id, reason_code, summary, status
) values (
  'DSP-$RUN_ID', '$CUSTOMER_B'::uuid, 'customer', '$CUSTOMER_B'::uuid, '$BIZ_B'::uuid, '$APPT_B'::uuid, '$INV_B'::uuid, 'service_quality', 'Isolation fixture', 'opened'
) returning id;")"
ok "Seeded garage A $BIZ_A and garage B $BIZ_B"

TOKEN_OWNER_A="$(sign_in "ti-owner-a@garagefinder.test")"
TOKEN_OWNER_B="$(sign_in "ti-owner-b@garagefinder.test")"
TOKEN_MANAGER_A="$(sign_in "ti-manager-a@garagefinder.test")"
TOKEN_STAFF_B="$(sign_in "ti-staff-b@garagefinder.test")"
TOKEN_CUSTOMER_A="$(sign_in "ti-customer-a@garagefinder.test")"
TOKEN_CUSTOMER_B="$(sign_in "ti-customer-b@garagefinder.test")"

log "RLS as authenticated roles"
[[ "$(rls_count "$OWNER_B" "select count(*) from public.appointments where id = '$APPT_B';")" == "1" ]] || fail "owner B cannot see own appointment"
ok "Owner B sees own appointment through RLS"
[[ "$(rls_count "$OWNER_A" "select count(*) from public.appointments where id = '$APPT_B';")" == "0" ]] || fail "owner A can read garage B appointment"
ok "Owner A cannot read garage B appointment through RLS"
[[ "$(rls_count "$CUSTOMER_B" "select count(*) from public.appointments where id = '$APPT_B';")" == "1" ]] || fail "customer B cannot see own appointment"
ok "Customer B sees own appointment through RLS"
[[ "$(rls_count "$CUSTOMER_A" "select count(*) from public.appointments where id = '$APPT_B';")" == "0" ]] || fail "customer A can read customer B appointment"
ok "Customer A cannot read customer B appointment through RLS"
[[ "$(rls_count "$CUSTOMER_A" "select count(*) from public.invoices where id = '$INV_B';")" == "0" ]] || fail "customer A can read garage B invoice"
ok "Customer A cannot read garage B invoice through RLS"
[[ "$(rls_count "$OWNER_A" "select count(*) from public.invoices where id = '$INV_B';")" == "0" ]] || fail "owner A can read garage B invoice"
ok "Owner A cannot read garage B invoice through RLS"
[[ "$(rls_count "$OWNER_A" "select count(*) from public.business_memberships where business_id = '$BIZ_B';")" == "0" ]] || fail "owner A can read garage B staff"
ok "Owner A cannot read garage B staff through RLS"
[[ "$(rls_count "$MANAGER_A" "select count(*) from public.products where business_id = '$BIZ_B';")" == "0" ]] || fail "manager A can read garage B products"
ok "Manager A cannot read garage B products through RLS"
patch_code="$(curl -sS -o "$TMP/body.json" -w "%{http_code}" -X PATCH \
  "$SUPABASE_URL/rest/v1/appointments?id=eq.$APPT_B" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN_OWNER_A" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"business_notes":"cross-tenant"}')"
if [[ "$patch_code" == "401" || "$patch_code" == "403" || "$patch_code" == "404" ]]; then
  ok "Owner A cannot patch garage B appointment through PostgREST (HTTP $patch_code)"
else
  patched="$(jq 'if type == "array" then length else 1 end' "$TMP/body.json")"
  [[ "$patched" == "0" ]] || fail "Owner A patched garage B appointment (HTTP $patch_code)"
  ok "Owner A patch changed no appointment rows (HTTP $patch_code)"
fi
[[ "$(psql_q "select coalesce(business_notes, '') from public.appointments where id = '$APPT_B';")" == "" ]] || fail "appointment notes changed"

log "PostgREST with signed-in tokens"
owner_a_rows="$(rest_ids "$TOKEN_OWNER_A" "appointments?id=eq.$APPT_B&select=id" | jq 'length')"
[[ "$owner_a_rows" == "0" ]] || fail "PostgREST returned garage B appointment to owner A"
ok "PostgREST hides garage B appointment from owner A"
owner_b_rows="$(rest_ids "$TOKEN_OWNER_B" "appointments?id=eq.$APPT_B&select=id" | jq 'length')"
[[ "$owner_b_rows" == "1" ]] || fail "PostgREST hid garage B appointment from its owner"
ok "PostgREST shows garage B appointment to owner B"
cust_a_inv="$(rest_ids "$TOKEN_CUSTOMER_A" "invoices?id=eq.$INV_B&select=id" | jq 'length')"
[[ "$cust_a_inv" == "0" ]] || fail "PostgREST returned garage B invoice to customer A"
ok "PostgREST hides garage B invoice from customer A"

log "API attacks"
code="$(api GET "/v1/businesses/$BIZ_B/members" "$TOKEN_OWNER_A")"
expect_denied "Owner A reads garage B staff" "$code"
code="$(api POST "/v1/businesses/$BIZ_B/products" "$TOKEN_MANAGER_A" \
  "$(jq -n --arg c "$PRD_CAT" '{categoryId:$c,name:"Leak Oil",price:10,stockStatus:"in_stock"}')")"
expect_denied "Manager A creates a garage B product" "$code"
code="$(api POST "/v1/appointments/$APPT_B/confirm" "$TOKEN_STAFF_B" "{}" "Idempotency-Key: ti-staff-confirm-$RUN_ID")"
expect_denied "Staff confirms an appointment" "$code"
code="$(api POST "/v1/appointments/$APPT_B/confirm" "$TOKEN_OWNER_A" "{}" "Idempotency-Key: ti-ownera-confirm-$RUN_ID")"
expect_denied "Owner A confirms garage B appointment" "$code"
code="$(api POST "/v1/businesses/$BIZ_B/temporary-closure" "$TOKEN_STAFF_B" '{"reason":"not allowed"}' "Idempotency-Key: ti-staff-close-$RUN_ID")"
expect_denied "Staff closes the garage" "$code"
code="$(api GET "/v1/appointments/$APPT_B" "$TOKEN_CUSTOMER_A")"
expect_denied "Customer A reads customer B appointment" "$code"
code="$(api GET "/v1/invoices/$INV_B" "$TOKEN_CUSTOMER_A")"
expect_denied "Customer A reads garage B invoice" "$code"
code="$(api POST "/v1/disputes/$DSP_B/evidence" "$TOKEN_CUSTOMER_A" \
  '{"originalFileName":"leak.jpg","mimeType":"image/jpeg","fileSizeBytes":1200}' \
  "Idempotency-Key: ti-evidence-$RUN_ID")"
expect_denied "Customer A uploads evidence on customer B dispute" "$code"
code="$(api POST "/v1/businesses/$BIZ_A/quotations" "$TOKEN_OWNER_A" \
  "$(jq -n --arg c "$CUSTOMER_B" --arg b "$BRANCH_A" --arg v "$VEHICLE_B" \
    '{customerId:$c,branchId:$b,vehicleId:$v,items:[{itemType:"custom",description:"Unrelated",quantity:1,unitPrice:"10.000"}]}')")"
if [[ "$code" == "400" || "$code" == "403" || "$code" == "404" || "$code" == "422" ]]; then
  ok "Garage A cannot quote an unrelated customer (HTTP $code)"
else
  fail "Garage A quoted an unrelated customer (HTTP $code) body=$(head -c 500 "$TMP/body.json")"
fi
QUOTE_COUNT="$(psql_q "select count(*) from public.quotations where business_id = '$BIZ_A' and customer_id = '$CUSTOMER_B';")"
[[ "$QUOTE_COUNT" == "0" ]] || fail "unrelated quotation was stored"
ok "No quotation stored for the unrelated customer"

log "Allowed controls"
code="$(api POST "/v1/appointments/$APPT_B/confirm" "$TOKEN_OWNER_B" "{}" "Idempotency-Key: ti-ownerb-confirm-$RUN_ID")"
expect_http "Owner B confirms own appointment" "$code" 200
code="$(api GET "/v1/appointments/$APPT_B" "$TOKEN_CUSTOMER_B")"
expect_http "Customer B reads own appointment" "$code" 200
code="$(api GET "/v1/invoices/$INV_B" "$TOKEN_CUSTOMER_B")"
expect_http "Customer B reads own invoice" "$code" 200
code="$(api POST "/v1/businesses/$BIZ_B/temporary-closure" "$TOKEN_OWNER_B" '{"reason":"pilot close"}' "Idempotency-Key: ti-ownerb-close-$RUN_ID")"
expect_http "Owner B closes own garage" "$code" 200
code="$(api POST "/v1/businesses/$BIZ_B/temporary-closure/reopen" "$TOKEN_OWNER_B" "{}" "Idempotency-Key: ti-ownerb-open-$RUN_ID")"
expect_http "Owner B reopens own garage" "$code" 200

log "Summary"
echo "PASS checks: $PASS"
echo "tenant_isolation_e2e: PASS"
