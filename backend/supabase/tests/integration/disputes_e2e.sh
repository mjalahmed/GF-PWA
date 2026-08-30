#!/usr/bin/env bash
# Phase 10 disputes authenticated e2e.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"
DB_HOST="${PGHOST:-127.0.0.1}"; DB_PORT="${PGPORT:-54322}"; DB_USER="${PGUSER:-postgres}"; DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

OWNER_EMAIL="dsp-owner@garagefinder.test"
CUSTOMER_EMAIL="dsp-customer@garagefinder.test"
OTHER_EMAIL="dsp-other@garagefinder.test"
OTHER_BIZ_EMAIL="dsp-otherbiz@garagefinder.test"
ADMIN_EMAIL="dsp-admin@garagefinder.test"
TEST_PASSWORD="DisputesE2E!local"
SLUG="dispute-e2e-garage"
OTHER_SLUG="dispute-e2e-other"
CR="DSP-E2E-CR-001"
OTHER_CR="DSP-E2E-CR-002"
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
      -d "$(jq -n --arg p "$TEST_PASSWORD" --arg n "$name" '{password:$p,email_confirm:true,user_metadata:{full_name:$n}}')" >/dev/null
  fi
  printf '%s' "$id"
}
sign_in(){ curl -sS -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "$(jq -n --arg e "$1" --arg p "$TEST_PASSWORD" '{email:$e,password:$p}')" | jq -er '.access_token'; }
assign_role(){
  psql_q "insert into public.user_roles (user_id, role_id, assigned_by) select '$1'::uuid, r.id, '$1'::uuid from public.roles r where r.code='$2' on conflict do nothing;" >/dev/null
}
next_weekday_slot(){
  python3 - <<'PY'
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
now = datetime.now(bh)
d = now.date() + timedelta(days=2)
while d.weekday() >= 5: d += timedelta(days=1)
print(datetime(d.year, d.month, d.day, 10, 0, tzinfo=bh).isoformat())
PY
}

log "Health"
code="$(curl -sS -o "$TMP/h.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
[[ "$code" == "200" ]] || fail "API down"
ok "API healthy"; psql_q "select 1" >/dev/null; ok "DB reachable"

OWNER_ID="$(ensure_user "$OWNER_EMAIL" "Dispute Owner")"
CUSTOMER_ID="$(ensure_user "$CUSTOMER_EMAIL" "Dispute Customer")"
OTHER_ID="$(ensure_user "$OTHER_EMAIL" "Other Customer")"
OTHER_BIZ_ID="$(ensure_user "$OTHER_BIZ_EMAIL" "Other Biz Owner")"
ADMIN_ID="$(ensure_user "$ADMIN_EMAIL" "Dispute Admin")"
assign_role "$ADMIN_ID" "admin"
ok "Users ready"

CAT="$(psql_q "select id from public.business_categories where code='garage' limit 1;")"
SVC_CAT="$(psql_q "select id from public.service_categories where code='maintenance' limit 1;")"

log "Seed businesses"
psql_q "
do \$\$
declare biz uuid; obr uuid;
begin
  delete from public.dispute_resolution_actions where dispute_id in (select id from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG')));
  delete from public.dispute_status_history where dispute_id in (select id from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG')));
  delete from public.dispute_evidence where dispute_id in (select id from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG')));
  delete from public.dispute_messages where dispute_id in (select id from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG')));
  delete from public.disputes where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG')) or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid);
  delete from public.review_moderation_events where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.review_ratings where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.review_responses where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.reviews where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid);
  delete from public.review_eligibilities where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid);
  delete from public.payment_events where payment_id in (select id from public.payments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.payment_attempts where payment_id in (select id from public.payments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.payments where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.invoice_status_history where invoice_id in (select id from public.invoices where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.invoice_items where invoice_id in (select id from public.invoices where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.invoices where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.quotation_status_history where quotation_id in (select id from public.quotations where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.quotation_items where quotation_id in (select id from public.quotations where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.quotations where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.appointment_status_history where appointment_id in (select id from public.appointments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.appointment_services where appointment_id in (select id from public.appointments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.appointments where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.services where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG'));
  delete from public.business_opening_hours where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG'));
  delete from public.business_branches where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG'));
  delete from public.business_memberships where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG'));
  delete from public.business_settings where business_id in (select id from public.businesses where slug in ('$SLUG','$OTHER_SLUG'));
  delete from public.businesses where slug in ('$SLUG','$OTHER_SLUG') or commercial_registration_number in ('$CR','$OTHER_CR');
  delete from public.vehicles where customer_id='$CUSTOMER_ID'::uuid;

  insert into public.businesses (slug, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, status, verification_status, approved_at)
  values ('$SLUG', '$CAT'::uuid, 'Dispute E2E WLL', 'Dispute E2E Garage', 'Disputes e2e', '$CR', '+97317220010', 'dsp@garagefinder.test', 'active', 'verified', now())
  returning id into biz;
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at) values (biz, '$OWNER_ID'::uuid, 'owner', 'active', now());
  insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
  values (biz, 'Main', 'Road 10', 'Manama', 'Seef', 'BH', 26.23, 50.58, true, true);
  insert into public.business_opening_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select biz, d, case when d in (0,6) then null else '09:00'::time end, case when d in (0,6) then null else '18:00'::time end, d in (0,6) from generate_series(0,6) d;
  update public.business_settings set appointments_enabled=true, invoices_enabled=true, cash_payments_enabled=true, quotations_enabled=true, reviews_enabled=true,
    minimum_booking_notice_minutes=0, maximum_booking_days_ahead=90, cancellation_notice_minutes=0 where business_id=biz;

  insert into public.businesses (slug, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, status, verification_status, approved_at)
  values ('$OTHER_SLUG', '$CAT'::uuid, 'Other Biz WLL', 'Other Biz', 'other', '$OTHER_CR', '+97317220011', 'otherbiz@garagefinder.test', 'active', 'verified', now())
  returning id into obr;
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at) values (obr, '$OTHER_BIZ_ID'::uuid, 'owner', 'active', now());
  insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
  values (obr, 'Main', 'Road 11', 'Manama', 'Seef', 'BH', 26.24, 50.58, true, true);
  insert into public.business_opening_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select obr, d, case when d in (0,6) then null else '09:00'::time end, case when d in (0,6) then null else '18:00'::time end, d in (0,6) from generate_series(0,6) d;
end \$\$;
" >/dev/null
BUSINESS_ID="$(psql_q "select id from public.businesses where slug='$SLUG';")"
BRANCH_ID="$(psql_q "select id from public.business_branches where business_id='$BUSINESS_ID' and is_primary;")"
OTHER_BUSINESS_ID="$(psql_q "select id from public.businesses where slug='$OTHER_SLUG';")"
ok "Seeded businesses"

OWNER_TOKEN="$(sign_in "$OWNER_EMAIL")"
CUSTOMER_TOKEN="$(sign_in "$CUSTOMER_EMAIL")"
OTHER_TOKEN="$(sign_in "$OTHER_EMAIL")"
OTHER_BIZ_TOKEN="$(sign_in "$OTHER_BIZ_EMAIL")"
ADMIN_TOKEN="$(sign_in "$ADMIN_EMAIL")"
ok "Tokens"

log "Commercial prep"
code="$(api POST "/v1/businesses/$BUSINESS_ID/services" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$SVC_CAT" '{categoryId:$c,name:"Alignment",pricingType:"fixed",price:35,estimatedDurationMinutes:60,requiresAppointment:true}')")"
expect "Create service" "$code" 200 201
SERVICE_ID="$(json '.data.id')"
code="$(api POST /v1/vehicles "$CUSTOMER_TOKEN" "$(jq -n '{makeText:"Kia",modelText:"Sportage",year:2022}')")"
expect "Create vehicle" "$code" 200 201
VEHICLE_ID="$(json '.data.id')"
SLOT="$(next_weekday_slot)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg v "$VEHICLE_ID" --arg t "$SLOT" \
    '{businessId:$b,branchId:$br,serviceId:$s,vehicleId:$v,scheduledStart:$t}')" \
  "Idempotency-Key: dsp-appt-$RUN_ID")"
expect "Create appointment" "$code" 200 201
APPT_ID="$(json '.data.id')"
code="$(api POST "/v1/appointments/$APPT_ID/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: dsp-confirm-$RUN_ID")"
expect "Confirm" "$code" 200
code="$(api POST "/v1/appointments/$APPT_ID/arrive" "$OWNER_TOKEN" "{}" "Idempotency-Key: dsp-arrive-$RUN_ID")"
expect "Arrive" "$code" 200
code="$(api POST "/v1/appointments/$APPT_ID/start" "$OWNER_TOKEN" "{}" "Idempotency-Key: dsp-start-$RUN_ID")"
expect "Start" "$code" 200
code="$(api POST "/v1/businesses/$BUSINESS_ID/appointments/$APPT_ID/invoice" "$OWNER_TOKEN" \
  "$(jq -n --arg s "$SERVICE_ID" '{requiresCustomerApproval:false,items:[{itemType:"service",serviceId:$s,description:"Alignment",quantity:1,unitPrice:"35.000"}]}')" \
  "Idempotency-Key: dsp-inv-$RUN_ID")"
expect "Create invoice" "$code" 200 201
INV_ID="$(json '.data.id')"
INV_NUM="$(json '.data.invoiceNumber')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_ID/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: dsp-issue-$RUN_ID")"
expect "Issue invoice" "$code" 200
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_ID/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"35.000"}' "Idempotency-Key: dsp-cash-$RUN_ID")"
expect "Cash payment" "$code" 200 201
PAY_ID="$(json '.data.id')"
code="$(api POST "/v1/appointments/$APPT_ID/complete" "$OWNER_TOKEN" "{}" "Idempotency-Key: dsp-complete-$RUN_ID")"
expect "Complete appointment" "$code" 200

# ---------------------------------------------------------------------------
# Scenario A — full dispute lifecycle
# ---------------------------------------------------------------------------
log "Scenario A — dispute lifecycle"
code="$(api POST /v1/disputes "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg i "$INV_ID" --arg p "$PAY_ID" --arg a "$APPT_ID" '{
    businessId:$b,invoiceId:$i,paymentId:$p,appointmentId:$a,
    reasonCode:"incorrect_invoice",summary:"Charged incorrectly",description:"Please review invoice amount"
  }')" \
  "Idempotency-Key: dsp-create-a-$RUN_ID")"
expect "Customer opens dispute" "$code" 200 201
DSP_ID="$(json '.data.id')"
DSP_NUM="$(json '.data.disputeNumber')"
[[ "$(json '.data.status')" == "awaiting_business" ]] || fail "expected awaiting_business"
ok "Dispute $DSP_NUM opened"

code="$(api POST "/v1/disputes/$DSP_ID/evidence" "$CUSTOMER_TOKEN" \
  '{"originalFileName":"receipt.pdf","mimeType":"application/pdf","fileSizeBytes":1024,"description":"receipt"}' \
  "Idempotency-Key: dsp-ev-a-$RUN_ID")"
expect "Customer uploads evidence metadata" "$code" 200 201
UPLOAD_URL="$(jq -r '.data.uploadUrl // .data.signedUploadUrl // empty' "$TMP/body.json")"
[[ -n "$UPLOAD_URL" ]] || fail "missing upload URL"
ok "Evidence upload URL issued"

code="$(api GET "/v1/businesses/$BUSINESS_ID/disputes/$DSP_ID" "$OWNER_TOKEN")"
expect "Business reads dispute" "$code" 200
INT_COUNT="$(jq -r '[.data.messages[]? | select(.isInternal==true)] | length' "$TMP/body.json")"
[[ "$INT_COUNT" == "0" ]] || fail "business saw internal messages"

code="$(api POST "/v1/businesses/$BUSINESS_ID/disputes/$DSP_ID/messages" "$OWNER_TOKEN" \
  '{"message":"We reviewed the invoice and believe it is correct."}' \
  "Idempotency-Key: dsp-biz-msg-$RUN_ID")"
expect "Business responds" "$code" 200 201

code="$(api POST "/v1/businesses/$BUSINESS_ID/disputes/$DSP_ID/evidence" "$OWNER_TOKEN" \
  '{"originalFileName":"work-order.pdf","mimeType":"application/pdf","fileSizeBytes":2048}' \
  "Idempotency-Key: dsp-biz-ev-$RUN_ID")"
expect "Business evidence" "$code" 200 201

code="$(api POST "/v1/admin/disputes/$DSP_ID/assign" "$ADMIN_TOKEN" \
  "$(jq -n --arg a "$ADMIN_ID" '{assignedAdminId:$a}')" \
  "Idempotency-Key: dsp-assign-$RUN_ID")"
expect "Admin assign" "$code" 200

code="$(api POST "/v1/admin/disputes/$DSP_ID/start-review" "$ADMIN_TOKEN" \
  '{"reason":"reviewing"}' "Idempotency-Key: dsp-review-$RUN_ID")"
expect "Admin start review" "$code" 200
[[ "$(json '.data.status')" == "under_review" ]] || fail "not under_review"

code="$(api POST "/v1/admin/disputes/$DSP_ID/internal-messages" "$ADMIN_TOKEN" \
  '{"message":"Internal: leaning customer supported"}' \
  "Idempotency-Key: dsp-int-$RUN_ID")"
expect "Internal note" "$code" 200 201

code="$(api GET "/v1/disputes/$DSP_ID" "$CUSTOMER_TOKEN")"
expect "Customer get after internal" "$code" 200
INT_COUNT="$(jq -r '[.data.messages[]? | select(.isInternal==true)] | length' "$TMP/body.json")"
[[ "$INT_COUNT" == "0" ]] || fail "customer saw internal message"
ok "Internal messages hidden from customer"

code="$(api POST "/v1/admin/disputes/$DSP_ID/resolve" "$ADMIN_TOKEN" \
  '{"resolutionCode":"customer_supported","resolutionSummary":"Partial goodwill adjustment noted; no automatic refund."}' \
  "Idempotency-Key: dsp-resolve-$RUN_ID")"
expect "Admin resolve" "$code" 200
[[ "$(json '.data.status')" == "resolved" ]] || fail "not resolved"

code="$(api POST "/v1/admin/disputes/$DSP_ID/close" "$ADMIN_TOKEN" \
  '{"reason":"done"}' "Idempotency-Key: dsp-close-$RUN_ID")"
expect "Admin close" "$code" 200
[[ "$(json '.data.status')" == "closed" ]] || fail "not closed"

NOTIFS="$(psql_q "select count(*) from public.notifications where entity_type='dispute' and created_at > now() - interval '1 hour';")"
[[ "$NOTIFS" -ge 1 ]] || fail "Expected dispute notifications ($NOTIFS)"
ok "Notifications present ($NOTIFS)"
AUDIT="$(psql_q "select count(*) from public.audit_logs where action like 'dispute.%' and created_at > now() - interval '1 hour';")"
[[ "$AUDIT" -ge 3 ]] || fail "Missing dispute audit ($AUDIT)"
ok "Audit records present ($AUDIT)"

# ---------------------------------------------------------------------------
# Scenario B — wrong customer
# ---------------------------------------------------------------------------
log "Scenario B — wrong customer denied"
code="$(api GET "/v1/disputes/$DSP_ID" "$OTHER_TOKEN")"
denied "Wrong customer reads dispute" "$code"

# ---------------------------------------------------------------------------
# Scenario C — wrong business
# ---------------------------------------------------------------------------
log "Scenario C — wrong business denied"
code="$(api GET "/v1/businesses/$OTHER_BUSINESS_ID/disputes/$DSP_ID" "$OTHER_BIZ_TOKEN")"
denied "Wrong business reads dispute" "$code"
code="$(api POST "/v1/businesses/$OTHER_BUSINESS_ID/disputes/$DSP_ID/messages" "$OTHER_BIZ_TOKEN" \
  '{"message":"hijack"}' "Idempotency-Key: dsp-wrongbiz-$RUN_ID")"
denied "Wrong business responds" "$code"

# ---------------------------------------------------------------------------
# Scenario D — duplicate active dispute
# ---------------------------------------------------------------------------
log "Scenario D — duplicate active dispute"
# create another paid invoice for fresh active dispute test
SLOT2="$(python3 - <<PY
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
base = datetime.fromisoformat("$SLOT").astimezone(bh).date() + timedelta(days=1)
while base.weekday() >= 5: base += timedelta(days=1)
print(datetime(base.year, base.month, base.day, 11, 0, tzinfo=bh).isoformat())
PY
)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg v "$VEHICLE_ID" --arg t "$SLOT2" \
    '{businessId:$b,branchId:$br,serviceId:$s,vehicleId:$v,scheduledStart:$t}')" \
  "Idempotency-Key: dsp-appt2-$RUN_ID")"
expect "Create appointment 2" "$code" 200 201
APPT2="$(json '.data.id')"
code="$(api POST "/v1/appointments/$APPT2/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: dsp-confirm2-$RUN_ID")"
expect "Confirm 2" "$code" 200
code="$(api POST "/v1/businesses/$BUSINESS_ID/appointments/$APPT2/invoice" "$OWNER_TOKEN" \
  "$(jq -n --arg s "$SERVICE_ID" '{requiresCustomerApproval:false,items:[{itemType:"service",serviceId:$s,description:"Alignment",quantity:1,unitPrice:"35.000"}]}')" \
  "Idempotency-Key: dsp-inv2-$RUN_ID")"
expect "Invoice 2" "$code" 200 201
INV2="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV2/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: dsp-issue2-$RUN_ID")"
expect "Issue 2" "$code" 200
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV2/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"35.000"}' "Idempotency-Key: dsp-cash2-$RUN_ID")"
expect "Cash 2" "$code" 200 201

code="$(api POST /v1/disputes "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg i "$INV2" '{businessId:$b,invoiceId:$i,reasonCode:"payment_issue",summary:"Payment concern"}')" \
  "Idempotency-Key: dsp-create-d1-$RUN_ID")"
expect "First dispute for INV2" "$code" 200 201
DSP2="$(json '.data.id')"

code="$(api POST /v1/disputes "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg i "$INV2" '{businessId:$b,invoiceId:$i,reasonCode:"payment_issue",summary:"Duplicate"}')" \
  "Idempotency-Key: dsp-create-d2-$RUN_ID")"
denied "Duplicate active dispute" "$code"

# ---------------------------------------------------------------------------
# Scenario E — business cannot resolve
# ---------------------------------------------------------------------------
log "Scenario E — business cannot resolve"
code="$(api POST "/v1/admin/disputes/$DSP2/resolve" "$OWNER_TOKEN" \
  '{"resolutionCode":"business_supported","resolutionSummary":"nope"}')"
denied "Business resolve denied" "$code"

code="$(api GET /v1/disputes "")"
denied "Anonymous disputes denied" "$code"

log "Summary"; echo "PASS checks: $PASS"; echo "disputes_e2e: PASS"
