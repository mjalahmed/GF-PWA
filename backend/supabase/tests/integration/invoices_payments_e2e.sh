#!/usr/bin/env bash
# Phase 8 invoices + cash payments authenticated e2e.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"
DB_HOST="${PGHOST:-127.0.0.1}"; DB_PORT="${PGPORT:-54322}"; DB_USER="${PGUSER:-postgres}"; DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

OWNER_EMAIL="inv-owner@garagefinder.test"
CUSTOMER_EMAIL="inv-customer@garagefinder.test"
OTHER_EMAIL="inv-other@garagefinder.test"
MECHANIC_EMAIL="inv-mechanic@garagefinder.test"
CASHIER_EMAIL="inv-cashier@garagefinder.test"
TEST_PASSWORD="InvoicesE2E!local"
SLUG="invoice-e2e-garage"
CR="INV-E2E-CR-001"
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
assert_num(){ python3 -c "assert abs(float('$1')-float('$2'))<0.001, ('$1','$2')"; }

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

OWNER_ID="$(ensure_user "$OWNER_EMAIL" "Invoice Owner")"
CUSTOMER_ID="$(ensure_user "$CUSTOMER_EMAIL" "Invoice Customer")"
OTHER_ID="$(ensure_user "$OTHER_EMAIL" "Invoice Other")"
MECHANIC_ID="$(ensure_user "$MECHANIC_EMAIL" "Invoice Mechanic")"
CASHIER_ID="$(ensure_user "$CASHIER_EMAIL" "Invoice Cashier")"
ok "Users ready"

CAT="$(psql_q "select id from public.business_categories where code='garage' limit 1;")"
SVC_CAT="$(psql_q "select id from public.service_categories where code='maintenance' limit 1;")"
PRD_CAT="$(psql_q "select id from public.product_categories where code='engine_oil' limit 1;")"

log "Seed business"
psql_q "
do \$\$
declare biz uuid; br uuid;
begin
  delete from public.payment_events where payment_id in (select id from public.payments where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.payment_attempts where payment_id in (select id from public.payments where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.refunds where invoice_id in (select id from public.invoices where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.payments where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid);
  delete from public.invoice_adjustments where invoice_id in (select id from public.invoices where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.invoice_status_history where invoice_id in (select id from public.invoices where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.invoice_items where invoice_id in (select id from public.invoices where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.invoices where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid);
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
  values ('$SLUG', '$CAT'::uuid, 'Invoice E2E WLL', 'Invoice E2E Garage', 'Invoices e2e', '$CR', '+97317220008', 'invoice@garagefinder.test', 'active', 'verified', now())
  returning id into biz;
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
  values
    (biz, '$OWNER_ID'::uuid, 'owner', 'active', now()),
    (biz, '$MECHANIC_ID'::uuid, 'mechanic', 'active', now()),
    (biz, '$CASHIER_ID'::uuid, 'cashier', 'active', now());
  insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
  values (biz, 'Main', 'Road 8', 'Manama', 'Seef', 'BH', 26.23, 50.58, true, true) returning id into br;
  insert into public.business_opening_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select biz, d, case when d in (0,6) then null else '09:00'::time end, case when d in (0,6) then null else '18:00'::time end, d in (0,6)
  from generate_series(0,6) d;
  update public.business_settings set
    appointments_enabled = true,
    quotations_enabled = true,
    invoices_enabled = true,
    cash_payments_enabled = true,
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
MECHANIC_TOKEN="$(sign_in "$MECHANIC_EMAIL")"
CASHIER_TOKEN="$(sign_in "$CASHIER_EMAIL")"
ok "Tokens"

log "Catalog + appointment prep"
code="$(api POST "/v1/businesses/$BUSINESS_ID/services" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$SVC_CAT" '{categoryId:$c,name:"Oil Change",pricingType:"fixed",price:40,estimatedDurationMinutes:60,requiresAppointment:true}')")"
expect "Create service" "$code" 200 201
SERVICE_ID="$(json '.data.id')"

code="$(api POST "/v1/businesses/$BUSINESS_ID/products" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$PRD_CAT" --arg b "$BRANCH_ID" '{categoryId:$c,branchId:$b,name:"Oil Filter",sku:"OF-1",price:10,stockStatus:"in_stock"}')")"
expect "Create product" "$code" 200 201
PRODUCT_ID="$(json '.data.id')"

code="$(api POST /v1/vehicles "$CUSTOMER_TOKEN" "$(jq -n '{makeText:"Toyota",modelText:"Camry",year:2020}')")"
expect "Create vehicle" "$code" 200 201
VEHICLE_ID="$(json '.data.id')"

SCHEDULE_START="$(next_weekday_slot)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg v "$VEHICLE_ID" --arg t "$SCHEDULE_START" \
    '{businessId:$b,branchId:$br,serviceId:$s,vehicleId:$v,scheduledStart:$t}')" \
  "Idempotency-Key: inv-appt-$RUN_ID")"
expect "Create appointment" "$code" 200 201
APPT_ID="$(json '.data.id')"
code="$(api POST "/v1/appointments/$APPT_ID/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-appt-confirm-$RUN_ID")"
expect "Confirm appointment" "$code" 200
code="$(api POST "/v1/appointments/$APPT_ID/arrive" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-appt-arrive-$RUN_ID")"
expect "Arrive" "$code" 200
code="$(api POST "/v1/appointments/$APPT_ID/start" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-appt-start-$RUN_ID")"
expect "Start" "$code" 200

# ---------------------------------------------------------------------------
# Scenario A — quotation → invoice → approve → full cash
# ---------------------------------------------------------------------------
log "Scenario A — quotation workflow"
code="$(api POST "/v1/businesses/$BUSINESS_ID/appointments/$APPT_ID/quotation" "$OWNER_TOKEN" \
  "$(jq -n --arg s "$SERVICE_ID" --arg p "$PRODUCT_ID" '{
    businessNotes:"quote-internal",
    customerMessage:"Quote for work",
    items:[
      {itemType:"service",serviceId:$s,description:"Oil Change",quantity:1,unitPrice:"40.000"},
      {itemType:"product",productId:$p,description:"Oil Filter",quantity:1,unitPrice:"10.000"},
      {itemType:"labor",description:"Labor",quantity:1,unitPrice:"50.000"}
    ]
  }')" \
  "Idempotency-Key: inv-quote-a-$RUN_ID")"
expect "Create quotation" "$code" 200 201
Q_A="$(json '.data.id')"
QUOTE_GRAND="$(json '.data.grandTotal')"
assert_num "$QUOTE_GRAND" 100
ok "Quotation grandTotal=$QUOTE_GRAND"

code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_A/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-quote-issue-a-$RUN_ID")"
expect "Issue quotation" "$code" 200
code="$(api POST "/v1/quotations/$Q_A/accept" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: inv-quote-accept-a-$RUN_ID")"
expect "Accept quotation" "$code" 200

code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_A/invoice" "$OWNER_TOKEN" \
  '{"requiresCustomerApproval":true,"businessNotes":"from-quote"}' \
  "Idempotency-Key: inv-from-quote-a-$RUN_ID")"
expect "Convert quotation to invoice" "$code" 200 201
INV_A="$(json '.data.id')"
INV_NUM_A="$(json '.data.invoiceNumber')"
assert_num "$(json '.data.grandTotal')" "$QUOTE_GRAND"
assert_num "$(json '.data.remainingTotal')" "$QUOTE_GRAND"
[[ "$(json '.data.quotationId')" == "$Q_A" ]] || fail "quotationId mismatch"
[[ "$(json '.data.status')" == "draft" ]] || fail "expected draft invoice"
ok "Invoice $INV_NUM_A from quotation"

Q_STATUS="$(psql_q "select status from public.quotations where id='$Q_A';")"
[[ "$Q_STATUS" == "converted_to_invoice" ]] || fail "quotation not converted ($Q_STATUS)"
ok "Quotation converted_to_invoice"

code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_A/invoice" "$OWNER_TOKEN" \
  '{"requiresCustomerApproval":true}' \
  "Idempotency-Key: inv-from-quote-a-replay-$RUN_ID")"
expect "Idempotent conversion" "$code" 200 201
[[ "$(json '.data.id')" == "$INV_A" ]] || fail "duplicate invoice created"
ok "Duplicate conversion returns same invoice"

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_A/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-issue-a-$RUN_ID")"
expect "Issue invoice A" "$code" 200
[[ "$(json '.data.status')" == "issued" ]] || fail "not issued"

code="$(api GET "/v1/invoices/$INV_A" "$OTHER_TOKEN")"
denied "Wrong customer reads invoice" "$code"

code="$(api GET "/v1/invoices/$INV_A" "$CUSTOMER_TOKEN")"
expect "Customer get invoice" "$code" 200
CUST_NOTES="$(jq -r '.data.businessNotes // empty' "$TMP/body.json")"
[[ -z "$CUST_NOTES" ]] || fail "Customer must not see businessNotes"

code="$(api POST "/v1/invoices/$INV_A/view" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: inv-view-a-$RUN_ID")"
expect "Customer view" "$code" 200

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_A/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"100.000"}' "Idempotency-Key: inv-cash-early-a-$RUN_ID")"
denied "Cash before approval denied" "$code"

code="$(api POST "/v1/invoices/$INV_A/approve" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: inv-approve-a-$RUN_ID")"
expect "Customer approve" "$code" 200
[[ "$(json '.data.status')" == "customer_approved" ]] || fail "not approved"

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_A/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"100.000"}' "Idempotency-Key: inv-cash-full-a-$RUN_ID")"
expect "Full cash payment" "$code" 200 201
[[ "$(json '.data.status')" == "captured" ]] || fail "payment not captured"
PAY_A="$(json '.data.id')"

INV_STATUS="$(psql_q "select status from public.invoices where id='$INV_A';")"
[[ "$INV_STATUS" == "paid" ]] || fail "invoice not paid ($INV_STATUS)"
PAID_TOTAL="$(psql_q "select paid_total::text from public.invoices where id='$INV_A';")"
REMAINING="$(psql_q "select remaining_total::text from public.invoices where id='$INV_A';")"
assert_num "$PAID_TOTAL" 100
assert_num "$REMAINING" 0
PAID_AT="$(psql_q "select paid_at is not null from public.invoices where id='$INV_A';")"
[[ "$PAID_AT" == "t" ]] || fail "paid_at not set"
ok "Invoice A paid; paidTotal==grandTotal; remaining=0"

code="$(api PATCH "/v1/businesses/$BUSINESS_ID/invoices/$INV_A" "$OWNER_TOKEN" \
  "$(jq -n '{items:[{itemType:"custom",description:"x",quantity:1,unitPrice:1}]}')")"
denied "Paid invoice mutation denied" "$code"

# ---------------------------------------------------------------------------
# Scenario B — appointment → draft invoice → issue → cash (no approval)
# ---------------------------------------------------------------------------
log "Scenario B — direct appointment invoice"
SCHEDULE_B="$(next_weekday_slot)"
# bump day for second appointment
SCHEDULE_B="$(python3 - <<PY
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
d = datetime.fromisoformat("$SCHEDULE_START").astimezone(bh).date() + timedelta(days=1)
while d.weekday() >= 5:
    d += timedelta(days=1)
print(datetime(d.year, d.month, d.day, 11, 0, tzinfo=bh).isoformat())
PY
)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg v "$VEHICLE_ID" --arg t "$SCHEDULE_B" \
    '{businessId:$b,branchId:$br,serviceId:$s,vehicleId:$v,scheduledStart:$t}')" \
  "Idempotency-Key: inv-appt-b-$RUN_ID")"
expect "Create appointment B" "$code" 200 201
APPT_B="$(json '.data.id')"
code="$(api POST "/v1/appointments/$APPT_B/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-appt-b-confirm-$RUN_ID")"
expect "Confirm B" "$code" 200

code="$(api POST "/v1/businesses/$BUSINESS_ID/appointments/$APPT_B/invoice" "$OWNER_TOKEN" \
  "$(jq -n --arg s "$SERVICE_ID" '{
    requiresCustomerApproval:false,
    items:[{itemType:"service",serviceId:$s,description:"Oil Change",quantity:1,unitPrice:"40.000"}]
  }')" \
  "Idempotency-Key: inv-from-appt-b-$RUN_ID")"
expect "Create appointment invoice" "$code" 200 201
INV_B="$(json '.data.id')"
assert_num "$(json '.data.grandTotal')" 40

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_B/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-issue-b-$RUN_ID")"
expect "Issue invoice B" "$code" 200

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_B/payments/cash" "$CASHIER_TOKEN" \
  '{"amount":"40.000"}' "Idempotency-Key: inv-cash-b-$RUN_ID")"
expect "Cashier records cash" "$code" 200 201
[[ "$(psql_q "select status from public.invoices where id='$INV_B';")" == "paid" ]] || fail "B not paid"
ok "Scenario B paid via cashier"

# ---------------------------------------------------------------------------
# Scenario C — partial payments
# ---------------------------------------------------------------------------
log "Scenario C — partial cash payments"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$CUSTOMER_ID" --arg br "$BRANCH_ID" '{
    customerId:$c,branchId:$br,requiresCustomerApproval:false,
    items:[{itemType:"custom",description:"Full service package",quantity:1,unitPrice:"100.000"}]
  }')" \
  "Idempotency-Key: inv-create-c-$RUN_ID")"
expect "Manual draft C" "$code" 200 201
INV_C="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_C/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-issue-c-$RUN_ID")"
expect "Issue C" "$code" 200

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_C/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"40.000"}' "Idempotency-Key: inv-cash-c1-$RUN_ID")"
expect "Partial cash 40" "$code" 200 201
[[ "$(psql_q "select status from public.invoices where id='$INV_C';")" == "partially_paid" ]] || fail "not partially_paid"
assert_num "$(psql_q "select remaining_total::text from public.invoices where id='$INV_C';")" 60
ok "Partial: remaining 60"

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_C/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"100.000"}' "Idempotency-Key: inv-cash-c-over-$RUN_ID")"
denied "Overpayment denied" "$code"

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_C/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"60.000"}' "Idempotency-Key: inv-cash-c2-$RUN_ID")"
expect "Final cash 60" "$code" 200 201
[[ "$(psql_q "select status from public.invoices where id='$INV_C';")" == "paid" ]] || fail "C not paid"
assert_num "$(psql_q "select remaining_total::text from public.invoices where id='$INV_C';")" 0
ok "Scenario C fully paid after partials"

# ---------------------------------------------------------------------------
# Scenario D — idempotency
# ---------------------------------------------------------------------------
log "Scenario D — cash idempotency"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$CUSTOMER_ID" --arg br "$BRANCH_ID" '{
    customerId:$c,branchId:$br,requiresCustomerApproval:false,
    items:[{itemType:"custom",description:"Idempotency bill",quantity:1,unitPrice:"50.000"}]
  }')" \
  "Idempotency-Key: inv-create-d-$RUN_ID")"
expect "Draft D" "$code" 200 201
INV_D="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_D/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-issue-d-$RUN_ID")"
expect "Issue D" "$code" 200

IDEM_KEY="inv-cash-idem-$RUN_ID"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_D/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"25.000"}' "Idempotency-Key: $IDEM_KEY")"
expect "Cash 25 with key X" "$code" 200 201
PAY_D="$(json '.data.id')"

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_D/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"25.000"}' "Idempotency-Key: $IDEM_KEY")"
expect "Replay same key+body" "$code" 200 201
[[ "$(json '.data.id')" == "$PAY_D" ]] || fail "replay created new payment"
PAY_COUNT="$(psql_q "select count(*) from public.payments where invoice_id='$INV_D';")"
[[ "$PAY_COUNT" == "1" ]] || fail "expected 1 payment got $PAY_COUNT"
ok "Idempotent replay safe"

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_D/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"30.000"}' "Idempotency-Key: $IDEM_KEY")"
[[ "$code" == "409" ]] || fail "same key different body expected 409 got $code"
ok "Same key different amount → 409"

# ---------------------------------------------------------------------------
# Scenario E — security
# ---------------------------------------------------------------------------
log "Scenario E — security denials"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_D/payments/cash" "$CUSTOMER_TOKEN" \
  '{"amount":"1.000"}' "Idempotency-Key: inv-cash-cust-$RUN_ID")"
denied "Customer cannot record cash" "$code"

code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_D/payments/cash" "$MECHANIC_TOKEN" \
  '{"amount":"1.000"}' "Idempotency-Key: inv-cash-mech-$RUN_ID")"
denied "Mechanic cannot record cash" "$code"

code="$(api GET "/v1/businesses/$BUSINESS_ID/invoices" "$CUSTOMER_TOKEN")"
denied "Customer cannot list business invoices" "$code"

code="$(api GET "/v1/invoices" "")"
denied "Anonymous invoices denied" "$code"

code="$(api GET "/v1/payments" "")"
denied "Anonymous payments denied" "$code"

# Suspended mechanic attempt — suspend cashier temporarily for suspended test
psql_q "update public.business_memberships set status='suspended' where business_id='$BUSINESS_ID' and user_id='$CASHIER_ID';" >/dev/null
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_D/payments/cash" "$CASHIER_TOKEN" \
  '{"amount":"1.000"}' "Idempotency-Key: inv-cash-susp-$RUN_ID")"
denied "Suspended member cannot record cash" "$code"
psql_q "update public.business_memberships set status='active' where business_id='$BUSINESS_ID' and user_id='$CASHIER_ID';" >/dev/null
ok "Security denials covered"

# Cancel eligible draft
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$CUSTOMER_ID" --arg br "$BRANCH_ID" '{
    customerId:$c,branchId:$br,
    items:[{itemType:"custom",description:"Cancel me",quantity:1,unitPrice:"5.000"}]
  }')" \
  "Idempotency-Key: inv-create-cancel-$RUN_ID")"
expect "Draft for cancel" "$code" 200 201
INV_E="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_E/cancel" "$OWNER_TOKEN" "{}" "Idempotency-Key: inv-cancel-e-$RUN_ID")"
expect "Cancel draft" "$code" 200
[[ "$(json '.data.status')" == "cancelled" ]] || fail "not cancelled"

NOTIFS="$(psql_q "select count(*) from public.notifications where entity_type='invoice' and user_id='$CUSTOMER_ID';")"
[[ "$NOTIFS" -ge 1 ]] || fail "Expected invoice notifications ($NOTIFS)"
ok "Notifications present ($NOTIFS)"

AUDIT="$(psql_q "select count(*) from public.audit_logs where (action like 'invoice.%' or action like 'payment.%') and created_at > now() - interval '1 hour';")"
[[ "$AUDIT" -ge 3 ]] || fail "Missing financial audit ($AUDIT)"
ok "Audit records present ($AUDIT)"

log "Summary"; echo "PASS checks: $PASS"; echo "invoices_payments_e2e: PASS"
