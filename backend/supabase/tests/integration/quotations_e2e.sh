#!/usr/bin/env bash
# Phase 7 quotations authenticated e2e.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"
DB_HOST="${PGHOST:-127.0.0.1}"; DB_PORT="${PGPORT:-54322}"; DB_USER="${PGUSER:-postgres}"; DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

OWNER_EMAIL="quote-owner@garagefinder.test"
CUSTOMER_EMAIL="quote-customer@garagefinder.test"
OTHER_EMAIL="quote-other@garagefinder.test"
TEST_PASSWORD="QuotationsE2E!local"
SLUG="quote-e2e-garage"
CR="QUOTE-E2E-CR-001"
RUN_ID="$(date +%s)-$$"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
PASS=0
log(){ printf '\n==> %s\n' "$*"; }
ok(){ printf '  PASS: %s\n' "$*"; PASS=$((PASS+1)); }
fail(){ printf '  FAIL: %s\n' "$*" >&2; exit 1; }
expect(){ local l="$1" a="$2"; shift 2; for e in "$@"; do [[ "$a" == "$e" ]] && { ok "$l (HTTP $a)"; return; }; done; fail "$l expected $* got $a body=$(head -c 500 "$TMP/body.json")"; }
denied(){ [[ "$2" =~ ^(401|403|404|409|422)$ ]] && ok "$1 (HTTP $2)" || fail "$1 expected denied got $2 body=$(head -c 300 "$TMP/body.json")"; }
psql_q(){ psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -At -c "$1"; }
json(){ local v; v="$(jq -r "$1" "$TMP/body.json")"; [[ "$v" == "null" ]] && fail "missing $1"; printf '%s' "$v"; }

api(){
  local m="$1" p="$2" t="${3:-}" b="${4:-}"; shift 3 || true; [[ $# -gt 0 ]] && shift || true
  local args=(-sS -o "$TMP/body.json" -w "%{http_code}" -X "$m" "$API_BASE$p" -H "Content-Type: application/json" -H "apikey: $ANON_KEY")
  [[ -n "$t" ]] && args+=(-H "Authorization: Bearer $t")
  for h in "$@"; do args+=(-H "$h"); done
  if [[ -n "$b" ]]; then args+=(-d "$b"); elif [[ "$m" =~ ^(POST|PATCH|PUT)$ ]]; then args+=(-d '{}'); fi
  curl "${args[@]}"
}

ensure_user(){
  local email="$1" name="$2" list id
  list="$(curl -sS "$SUPABASE_URL/auth/v1/admin/users?page=1&per_page=200" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY")"
  id="$(jq -r --arg e "$email" '(.users//[])|map(select(.email==$e))[0].id//empty' <<<"$list")"
  if [[ -z "$id" ]]; then
    id="$(curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
      -d "$(jq -n --arg e "$email" --arg p "$TEST_PASSWORD" --arg n "$name" '{email:$e,password:$p,email_confirm:true,user_metadata:{full_name:$n}}')" | jq -er '.id')"
  else
    curl -sS -X PUT "$SUPABASE_URL/auth/v1/admin/users/$id" -H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
      -d "$(jq -n --arg p "$TEST_PASSWORD" '{password:$p,email_confirm:true}')" >/dev/null
  fi
  printf '%s' "$id"
}
sign_in(){ curl -sS -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "$(jq -n --arg e "$1" --arg p "$TEST_PASSWORD" '{email:$e,password:$p}')" | jq -er '.access_token'; }

next_weekday_slot(){
  python3 - <<'PY'
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
now = datetime.now(bh)
d = now.date() + timedelta(days=2)
while d.weekday() >= 5:
    d += timedelta(days=1)
print(datetime(d.year, d.month, d.day, 10, 0, tzinfo=bh).isoformat())
PY
}

log "Health"
code="$(curl -sS -o "$TMP/h.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
[[ "$code" == "200" ]] || fail "API down — run make backend:serve"
ok "API healthy"; psql_q "select 1" >/dev/null; ok "DB reachable"

OWNER_ID="$(ensure_user "$OWNER_EMAIL" "Quote Owner")"
CUSTOMER_ID="$(ensure_user "$CUSTOMER_EMAIL" "Quote Customer")"
OTHER_ID="$(ensure_user "$OTHER_EMAIL" "Quote Other")"
ok "Users ready"

CAT="$(psql_q "select id from public.business_categories where code='garage' limit 1;")"
SVC_CAT="$(psql_q "select id from public.service_categories where code='maintenance' limit 1;")"
PRD_CAT="$(psql_q "select id from public.product_categories where code='engine_oil' limit 1;")"

log "Seed business"
psql_q "
do \$\$
declare biz uuid; br uuid;
begin
  delete from public.quotation_status_history where quotation_id in (select id from public.quotations where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.quotation_items where quotation_id in (select id from public.quotations where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.quotations where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid);
  delete from public.appointment_status_history where appointment_id in (select id from public.appointments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.appointment_services where appointment_id in (select id from public.appointments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.appointments where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.products where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.services where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_opening_hours where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_branches where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_memberships where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_settings where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.businesses where slug='$SLUG' or commercial_registration_number='$CR';
  delete from public.vehicles where customer_id='$CUSTOMER_ID'::uuid;

  insert into public.businesses (slug, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, status, verification_status, approved_at)
  values ('$SLUG', '$CAT'::uuid, 'Quote E2E WLL', 'Quote E2E Garage', 'Quotations e2e', '$CR', '+97317220003', 'quote@garagefinder.test', 'active', 'verified', now())
  returning id into biz;
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
  values (biz, '$OWNER_ID'::uuid, 'owner', 'active', now());
  insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
  values (biz, 'Main', 'Road 3', 'Manama', 'Seef', 'BH', 26.23, 50.58, true, true) returning id into br;
  insert into public.business_opening_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select biz, d, case when d in (0,6) then null else '09:00'::time end, case when d in (0,6) then null else '18:00'::time end, d in (0,6)
  from generate_series(0,6) d;
  update public.business_settings set
    appointments_enabled = true,
    quotations_enabled = true,
    auto_confirm_appointments = false,
    default_appointment_duration_minutes = 60,
    minimum_booking_notice_minutes = 0,
    maximum_booking_days_ahead = 90,
    cancellation_notice_minutes = 0
  where business_id = biz;
end \$\$;
" >/dev/null
BUSINESS_ID="$(psql_q "select id from public.businesses where slug='$SLUG';")"
BRANCH_ID="$(psql_q "select id from public.business_branches where business_id='$BUSINESS_ID' and is_primary;")"
ok "Seeded business=$BUSINESS_ID"

OWNER_TOKEN="$(sign_in "$OWNER_EMAIL")"
CUSTOMER_TOKEN="$(sign_in "$CUSTOMER_EMAIL")"
OTHER_TOKEN="$(sign_in "$OTHER_EMAIL")"
ok "Tokens"

log "Catalog + appointment prep"
code="$(api POST "/v1/businesses/$BUSINESS_ID/services" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$SVC_CAT" '{categoryId:$c,name:"Diagnosis",pricingType:"fixed",price:20,estimatedDurationMinutes:60,requiresAppointment:true}')")"
expect "Create service" "$code" 200 201
SERVICE_ID="$(json '.data.id')"

code="$(api POST "/v1/businesses/$BUSINESS_ID/products" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$PRD_CAT" --arg b "$BRANCH_ID" '{categoryId:$c,branchId:$b,name:"Brake Pads",sku:"BP-1",price:12.5,stockStatus:"in_stock"}')")"
expect "Create product" "$code" 200 201
PRODUCT_ID="$(json '.data.id')"

code="$(api POST /v1/vehicles "$CUSTOMER_TOKEN" "$(jq -n '{makeText:"Honda",modelText:"Civic",year:2019}')")"
expect "Create vehicle" "$code" 200 201
VEHICLE_ID="$(json '.data.id')"

SCHEDULE_START="$(next_weekday_slot)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg v "$VEHICLE_ID" --arg t "$SCHEDULE_START" \
    '{businessId:$b,branchId:$br,serviceId:$s,vehicleId:$v,scheduledStart:$t}')" \
  "Idempotency-Key: quote-appt-$RUN_ID")"
expect "Create appointment" "$code" 200 201
APPT_ID="$(json '.data.id')"
code="$(api POST "/v1/appointments/$APPT_ID/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-appt-confirm-$RUN_ID")"
expect "Confirm appointment" "$code" 200
code="$(api POST "/v1/appointments/$APPT_ID/arrive" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-appt-arrive-$RUN_ID")"
expect "Arrive" "$code" 200
code="$(api POST "/v1/appointments/$APPT_ID/start" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-appt-start-$RUN_ID")"
expect "Start" "$code" 200

log "Scenario A — draft → issue → view → accept"
code="$(api POST "/v1/businesses/$BUSINESS_ID/appointments/$APPT_ID/quotation" "$OWNER_TOKEN" \
  "$(jq -n --arg s "$SERVICE_ID" --arg p "$PRODUCT_ID" '{
    businessNotes:"internal",
    customerMessage:"Please review",
    items:[
      {itemType:"service",serviceId:$s,description:"Diagnosis",quantity:1,unitPrice:"20.000"},
      {itemType:"product",productId:$p,description:"Brake Pads",quantity:1,unitPrice:"12.500"},
      {itemType:"labor",description:"Labor",quantity:1,unitPrice:"50.000",discountAmount:"2.000",taxAmount:"0.500"}
    ]
  }')" \
  "Idempotency-Key: quote-create-a-$RUN_ID")"
expect "Create appointment quotation" "$code" 200 201
Q_A="$(json '.data.id')"
GRAND="$(json '.data.grandTotal')"
# 20 + 12.5 + (50-2+0.5) = 81
python3 - <<PY
g=float("$GRAND")
assert abs(g-81.0)<0.001, g
print("ok")
PY
ok "Server totals grandTotal=$GRAND"
NOTES="$(jq -r '.data.businessNotes // empty' "$TMP/body.json")"
[[ -n "$NOTES" ]] || fail "Business DTO should include businessNotes"

code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_A/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-issue-a-$RUN_ID")"
expect "Issue A" "$code" 200
[[ "$(json '.data.status')" == "issued" ]] || fail "not issued"

code="$(api GET "/v1/quotations/$Q_A" "$OTHER_TOKEN")"
denied "Cross-customer get denied" "$code"

code="$(api GET "/v1/quotations/$Q_A" "$CUSTOMER_TOKEN")"
expect "Customer get" "$code" 200
CUST_NOTES="$(jq -r '.data.businessNotes // empty' "$TMP/body.json")"
[[ -z "$CUST_NOTES" ]] || fail "Customer must not see businessNotes"

code="$(api POST "/v1/quotations/$Q_A/view" "$CUSTOMER_TOKEN" "{}")"
expect "Customer view" "$code" 200
[[ "$(json '.data.status')" == "viewed" ]] || fail "not viewed"

code="$(api PATCH "/v1/businesses/$BUSINESS_ID/quotations/$Q_A" "$OWNER_TOKEN" \
  "$(jq -n '{items:[{itemType:"custom",description:"x",quantity:1,unitPrice:1}]}')")"
denied "Accepted-path: issued not editable" "$code"

code="$(api POST "/v1/quotations/$Q_A/accept" "$OTHER_TOKEN" "{}")"
denied "Wrong customer accept" "$code"

code="$(api POST "/v1/quotations/$Q_A/accept" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: quote-accept-a-$RUN_ID")"
expect "Accept A" "$code" 200
[[ "$(json '.data.status')" == "accepted" ]] || fail "not accepted"

code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_A/cancel" "$OWNER_TOKEN" "{}")"
denied "Accepted immutable cancel" "$code"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_A/revise" "$OWNER_TOKEN" "{}")"
denied "Accepted cannot revise" "$code"

log "Scenario B — reject → revise → accept"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$CUSTOMER_ID" --arg br "$BRANCH_ID" '{
    customerId:$c,branchId:$br,
    items:[{itemType:"custom",description:"Parts kit",quantity:1,unitPrice:"30.000"}]
  }')" \
  "Idempotency-Key: quote-create-b-$RUN_ID")"
expect "Create draft B" "$code" 200 201
Q_B="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_B/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-issue-b-$RUN_ID")"
expect "Issue B" "$code" 200
code="$(api POST "/v1/quotations/$Q_B/reject" "$CUSTOMER_TOKEN" '{"note":"too expensive"}' "Idempotency-Key: quote-reject-b-$RUN_ID")"
expect "Reject B" "$code" 200
[[ "$(json '.data.status')" == "rejected" ]] || fail "not rejected"

code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_B/revise" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-revise-b-$RUN_ID")"
expect "Revise B" "$code" 200 201
Q_B2="$(json '.data.id')"
[[ "$(json '.data.status')" == "draft" ]] || fail "revision not draft"
[[ "$(json '.data.revisionNumber')" == "2" ]] || fail "expected revision 2"
[[ "$(json '.data.previousRevisionId')" == "$Q_B" ]] || fail "previous revision link"

code="$(api PATCH "/v1/businesses/$BUSINESS_ID/quotations/$Q_B2" "$OWNER_TOKEN" \
  "$(jq -n '{items:[{itemType:"custom",description:"Parts kit revised",quantity:1,unitPrice:"25.000"}]}')")"
expect "Update revision draft" "$code" 200
[[ "$(json '.data.grandTotal')" == "25" || "$(json '.data.grandTotal')" == "25.0" || "$(json '.data.grandTotal')" == "25.000" ]] || \
  { G="$(json '.data.grandTotal')"; python3 -c "assert abs(float('$G')-25)<0.001"; }

code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_B2/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-issue-b2-$RUN_ID")"
expect "Issue revision" "$code" 200
code="$(api POST "/v1/quotations/$Q_B2/accept" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: quote-accept-b2-$RUN_ID")"
expect "Accept revision" "$code" 200

OLD_STATUS="$(psql_q "select status from public.quotations where id='$Q_B';")"
[[ "$OLD_STATUS" == "rejected" ]] || fail "old revision not preserved ($OLD_STATUS)"
ok "Old rejected revision preserved"

log "Scenario C — expiry"
VALID_UNTIL="$(python3 - <<'PY'
from datetime import datetime, timedelta, timezone
print((datetime.now(timezone.utc)-timedelta(hours=1)).isoformat().replace('+00:00','Z'))
PY
)"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$CUSTOMER_ID" --arg br "$BRANCH_ID" --arg v "$VALID_UNTIL" '{
    customerId:$c,branchId:$br,validUntil:$v,
    items:[{itemType:"custom",description:"Expired offer",quantity:1,unitPrice:"9.000"}]
  }')" \
  "Idempotency-Key: quote-create-c-$RUN_ID")"
expect "Create expiring draft" "$code" 200 201
Q_C="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_C/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-issue-c-$RUN_ID")"
expect "Issue C" "$code" 200
code="$(api POST "/v1/quotations/$Q_C/accept" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: quote-accept-c-$RUN_ID")"
denied "Expired cannot accept" "$code"

log "Security denials"
code="$(api GET "/v1/businesses/$BUSINESS_ID/quotations" "$CUSTOMER_TOKEN")"
denied "Customer cannot list business quotations" "$code"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations" "$CUSTOMER_TOKEN" \
  "$(jq -n --arg c "$CUSTOMER_ID" --arg br "$BRANCH_ID" '{customerId:$c,branchId:$br,items:[{itemType:"custom",description:"x",quantity:1,unitPrice:1}]}')")"
denied "Customer cannot create business quotation" "$code"
code="$(api GET "/v1/quotations" "")"
denied "Anonymous list denied" "$code"

log "Cancel draft"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$CUSTOMER_ID" --arg br "$BRANCH_ID" '{
    customerId:$c,branchId:$br,
    items:[{itemType:"custom",description:"Cancel me",quantity:1,unitPrice:"1.000"}]
  }')" \
  "Idempotency-Key: quote-create-cancel-$RUN_ID")"
expect "Draft for cancel" "$code" 200 201
Q_D="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_D/cancel" "$OWNER_TOKEN" "{}" "Idempotency-Key: quote-cancel-d-$RUN_ID")"
expect "Cancel draft" "$code" 200
[[ "$(json '.data.status')" == "cancelled" ]] || fail "not cancelled"

NOTIFS="$(psql_q "select count(*) from public.notifications where entity_type='quotation' and user_id='$CUSTOMER_ID';")"
[[ "$NOTIFS" -ge 1 ]] || fail "Expected quotation notifications ($NOTIFS)"
ok "Notifications present ($NOTIFS)"

AUDIT="$(psql_q "select count(*) from public.audit_logs where action like 'quotation.%' and created_at > now() - interval '1 hour';")"
[[ "$AUDIT" -ge 3 ]] || fail "Missing quotation audit ($AUDIT)"
ok "Audit records present ($AUDIT)"

log "Summary"; echo "PASS checks: $PASS"; echo "quotations_e2e: PASS"
