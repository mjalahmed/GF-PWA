#!/usr/bin/env bash
# Full GarageFinder commercial lifecycle e2e (Phase 10 acceptance).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"
DB_HOST="${PGHOST:-127.0.0.1}"; DB_PORT="${PGPORT:-54322}"; DB_USER="${PGUSER:-postgres}"; DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

OWNER_EMAIL="cf-owner@garagefinder.test"
CUSTOMER_EMAIL="cf-customer@garagefinder.test"
ADMIN_EMAIL="cf-admin@garagefinder.test"
TEST_PASSWORD="CommercialFlowE2E!local"
SLUG="commercial-flow-garage"
CR="CF-E2E-CR-001"
RUN_ID="$(date +%s)-$$"
RATINGS_JSON='{"work_quality":5,"pricing_transparency":5,"timeliness":4,"customer_service":5,"overall_experience":5}'

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
PASS=0
log(){ printf '\n==> %s\n' "$*"; }
ok(){ printf '  PASS: %s\n' "$*"; PASS=$((PASS+1)); }
fail(){ printf '  FAIL: %s\n' "$*" >&2; exit 1; }
expect(){ local l="$1" a="$2"; shift 2; for e in "$@"; do [[ "$a" == "$e" ]] && { ok "$l (HTTP $a)"; return; }; done; fail "$l expected $* got $a body=$(head -c 500 "$TMP/body.json")"; }
psql_q(){ psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -At -c "$1"; }
json(){ local v; v="$(jq -r "$1" "$TMP/body.json")"; [[ "$v" == "null" ]] && fail "missing $1"; printf '%s' "$v"; }
assert_num(){ python3 -c "import sys; a=float(sys.argv[1]); b=float(sys.argv[2]); assert abs(a-b)<0.001" "$1" "$2"; }

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
assign_role(){ psql_q "insert into public.user_roles (user_id, role_id, assigned_by) select '$1'::uuid, r.id, '$1'::uuid from public.roles r where r.code='$2' on conflict do nothing;" >/dev/null; }
next_weekday_slot(){
  python3 - <<'PY'
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
now = datetime.now(bh); d = now.date() + timedelta(days=2)
while d.weekday() >= 5: d += timedelta(days=1)
print(datetime(d.year, d.month, d.day, 10, 0, tzinfo=bh).isoformat())
PY
}

log "Health"
code="$(curl -sS -o "$TMP/h.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
[[ "$code" == "200" ]] || fail "API down"
ok "API healthy"

OWNER_ID="$(ensure_user "$OWNER_EMAIL" "CF Owner")"
CUSTOMER_ID="$(ensure_user "$CUSTOMER_EMAIL" "CF Customer")"
ADMIN_ID="$(ensure_user "$ADMIN_EMAIL" "CF Admin")"
assign_role "$ADMIN_ID" "admin"
CAT="$(psql_q "select id from public.business_categories where code='garage' limit 1;")"
SVC_CAT="$(psql_q "select id from public.service_categories where code='maintenance' limit 1;")"
PRD_CAT="$(psql_q "select id from public.product_categories where code='engine_oil' limit 1;")"

log "Seed"
psql_q "
do \$\$
declare biz uuid;
begin
  delete from public.dispute_resolution_actions where dispute_id in (select id from public.disputes where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.dispute_status_history where dispute_id in (select id from public.disputes where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.dispute_evidence where dispute_id in (select id from public.disputes where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.dispute_messages where dispute_id in (select id from public.disputes where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.disputes where business_id in (select id from public.businesses where slug='$SLUG') or customer_id='$CUSTOMER_ID'::uuid;
  delete from public.review_moderation_events where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.review_ratings where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.review_responses where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.reviews where business_id in (select id from public.businesses where slug='$SLUG') or customer_id='$CUSTOMER_ID'::uuid;
  delete from public.review_eligibilities where business_id in (select id from public.businesses where slug='$SLUG') or customer_id='$CUSTOMER_ID'::uuid;
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
  delete from public.products where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.services where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_opening_hours where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_branches where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_memberships where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_settings where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.businesses where slug='$SLUG' or commercial_registration_number='$CR';
  delete from public.vehicles where customer_id='$CUSTOMER_ID'::uuid;

  insert into public.businesses (slug, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, status, verification_status, approved_at, average_rating, rating_count)
  values ('$SLUG', '$CAT'::uuid, 'Commercial Flow WLL', 'Commercial Flow Garage', 'full lifecycle', '$CR', '+97317220012', 'cf@garagefinder.test', 'active', 'verified', now(), 0, 0)
  returning id into biz;
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at) values (biz, '$OWNER_ID'::uuid, 'owner', 'active', now());
  insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
  values (biz, 'Main', 'Road 12', 'Manama', 'Seef', 'BH', 26.23, 50.58, true, true);
  insert into public.business_opening_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select biz, d, case when d in (0,6) then null else '09:00'::time end, case when d in (0,6) then null else '18:00'::time end, d in (0,6) from generate_series(0,6) d;
  update public.business_settings set appointments_enabled=true, quotations_enabled=true, invoices_enabled=true, cash_payments_enabled=true, reviews_enabled=true,
    minimum_booking_notice_minutes=0, maximum_booking_days_ahead=90, cancellation_notice_minutes=0 where business_id=biz;
end \$\$;
" >/dev/null
BUSINESS_ID="$(psql_q "select id from public.businesses where slug='$SLUG';")"
BRANCH_ID="$(psql_q "select id from public.business_branches where business_id='$BUSINESS_ID' and is_primary;")"
ok "Seeded $BUSINESS_ID"

OWNER_TOKEN="$(sign_in "$OWNER_EMAIL")"
CUSTOMER_TOKEN="$(sign_in "$CUSTOMER_EMAIL")"
ADMIN_TOKEN="$(sign_in "$ADMIN_EMAIL")"

log "1 Discovery / catalog"
code="$(api GET "/v1/discovery/businesses?query=Commercial" "$CUSTOMER_TOKEN")"
[[ "$code" == "200" ]] || fail "discovery unexpected $code"
ok "Discovery reachable ($code)"

code="$(api POST "/v1/businesses/$BUSINESS_ID/services" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$SVC_CAT" '{categoryId:$c,name:"Full Service",pricingType:"fixed",price:80,estimatedDurationMinutes:90,requiresAppointment:true}')")"
expect "Create service" "$code" 200 201
SERVICE_ID="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/products" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$PRD_CAT" --arg b "$BRANCH_ID" '{categoryId:$c,branchId:$b,name:"Filter",sku:"CF-1",price:20,stockStatus:"in_stock"}')")"
expect "Create product" "$code" 200 201
PRODUCT_ID="$(json '.data.id')"

log "2 Appointment"
code="$(api POST /v1/vehicles "$CUSTOMER_TOKEN" "$(jq -n '{makeText:"Mazda",modelText:"CX-5",year:2021}')")"
expect "Create vehicle" "$code" 200 201
VEHICLE_ID="$(json '.data.id')"
SLOT="$(next_weekday_slot)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg v "$VEHICLE_ID" --arg t "$SLOT" \
    '{businessId:$b,branchId:$br,serviceId:$s,vehicleId:$v,scheduledStart:$t}')" \
  "Idempotency-Key: cf-appt-$RUN_ID")"
expect "Book appointment" "$code" 200 201
APPT_ID="$(json '.data.id')"
code="$(api POST "/v1/appointments/$APPT_ID/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: cf-confirm-$RUN_ID")"
expect "Confirm" "$code" 200
code="$(api POST "/v1/appointments/$APPT_ID/arrive" "$OWNER_TOKEN" "{}" "Idempotency-Key: cf-arrive-$RUN_ID")"
expect "Arrive" "$code" 200
code="$(api POST "/v1/appointments/$APPT_ID/start" "$OWNER_TOKEN" "{}" "Idempotency-Key: cf-start-$RUN_ID")"
expect "Start" "$code" 200

log "3 Quotation"
code="$(api POST "/v1/businesses/$BUSINESS_ID/appointments/$APPT_ID/quotation" "$OWNER_TOKEN" \
  "$(jq -n --arg s "$SERVICE_ID" --arg p "$PRODUCT_ID" '{
    items:[
      {itemType:"service",serviceId:$s,description:"Full Service",quantity:1,unitPrice:"80.000"},
      {itemType:"product",productId:$p,description:"Filter",quantity:1,unitPrice:"20.000"}
    ]
  }')" \
  "Idempotency-Key: cf-quote-$RUN_ID")"
expect "Create quotation" "$code" 200 201
Q_ID="$(json '.data.id')"
assert_num "$(json '.data.grandTotal')" 100
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_ID/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: cf-qissue-$RUN_ID")"
expect "Issue quotation" "$code" 200
code="$(api POST "/v1/quotations/$Q_ID/accept" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: cf-qaccept-$RUN_ID")"
expect "Accept quotation" "$code" 200

log "4 Invoice + payment"
code="$(api POST "/v1/businesses/$BUSINESS_ID/quotations/$Q_ID/invoice" "$OWNER_TOKEN" \
  '{"requiresCustomerApproval":true}' "Idempotency-Key: cf-inv-$RUN_ID")"
expect "Convert to invoice" "$code" 200 201
INV_ID="$(json '.data.id')"
assert_num "$(json '.data.grandTotal')" 100
[[ "$(psql_q "select status from public.quotations where id='$Q_ID';")" == "converted_to_invoice" ]] || fail "quote not converted"
ok "Quotation converted"
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_ID/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: cf-iissue-$RUN_ID")"
expect "Issue invoice" "$code" 200
code="$(api POST "/v1/invoices/$INV_ID/approve" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: cf-iapprove-$RUN_ID")"
expect "Approve invoice" "$code" 200
code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_ID/payments/cash" "$OWNER_TOKEN" \
  '{"amount":"100.000"}' "Idempotency-Key: cf-cash-$RUN_ID")"
expect "Cash payment" "$code" 200 201
PAY_ID="$(json '.data.id')"
[[ "$(psql_q "select status from public.invoices where id='$INV_ID';")" == "paid" ]] || fail "invoice not paid"
ok "Invoice paid"

log "5 Complete + review"
code="$(api POST "/v1/appointments/$APPT_ID/complete" "$OWNER_TOKEN" "{}" "Idempotency-Key: cf-complete-$RUN_ID")"
expect "Complete appointment" "$code" 200
[[ "$(psql_q "select status from public.appointments where id='$APPT_ID';")" == "completed" ]] || fail "appt not completed"
ok "Appointment completed"
ELIG_ID="$(psql_q "select id from public.review_eligibilities where invoice_id='$INV_ID';")"
[[ -n "$ELIG_ID" ]] || fail "no eligibility"
ok "Review eligibility created"
code="$(api POST /v1/reviews "$CUSTOMER_TOKEN" \
  "$(jq -n --arg e "$ELIG_ID" --argjson r "$RATINGS_JSON" '{eligibilityId:$e,overallRating:5,comment:"Excellent verified service",ratings:$r}')" \
  "Idempotency-Key: cf-review-$RUN_ID")"
expect "Submit review" "$code" 200 201
REVIEW_ID="$(json '.data.id')"
[[ "$(json '.data.verified')" == "true" ]] || fail "not verified"
[[ "$(psql_q "select is_used from public.review_eligibilities where id='$ELIG_ID';")" == "t" ]] || fail "eligibility not consumed"
ok "Eligibility consumed"
CNT="$(psql_q "select rating_count from public.businesses where id='$BUSINESS_ID';")"
[[ "$CNT" == "1" ]] || fail "rating_count=$CNT"
ok "Business rating updated"

log "6 Dispute"
code="$(api POST /v1/disputes "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg i "$INV_ID" --arg p "$PAY_ID" --arg a "$APPT_ID" --arg r "$REVIEW_ID" '{
    businessId:$b,invoiceId:$i,paymentId:$p,appointmentId:$a,reviewId:$r,
    reasonCode:"service_quality",summary:"Follow-up concern after service"
  }')" \
  "Idempotency-Key: cf-dispute-$RUN_ID")"
expect "Open dispute" "$code" 200 201
DSP_ID="$(json '.data.id')"
code="$(api POST "/v1/businesses/$BUSINESS_ID/disputes/$DSP_ID/messages" "$OWNER_TOKEN" \
  '{"message":"Happy to discuss the concern."}' "Idempotency-Key: cf-dmsg-$RUN_ID")"
expect "Business dispute response" "$code" 200 201
code="$(api POST "/v1/admin/disputes/$DSP_ID/assign" "$ADMIN_TOKEN" \
  "$(jq -n --arg a "$ADMIN_ID" '{assignedAdminId:$a}')" "Idempotency-Key: cf-dassign-$RUN_ID")"
expect "Assign dispute" "$code" 200
code="$(api POST "/v1/admin/disputes/$DSP_ID/start-review" "$ADMIN_TOKEN" "{}" "Idempotency-Key: cf-dreview-$RUN_ID")"
expect "Start review" "$code" 200
code="$(api POST "/v1/admin/disputes/$DSP_ID/resolve" "$ADMIN_TOKEN" \
  '{"resolutionCode":"mutual_resolution","resolutionSummary":"Parties aligned; no refund executed."}' \
  "Idempotency-Key: cf-dresolve-$RUN_ID")"
expect "Resolve dispute" "$code" 200
code="$(api POST "/v1/admin/disputes/$DSP_ID/close" "$ADMIN_TOKEN" "{}" "Idempotency-Key: cf-dclose-$RUN_ID")"
expect "Close dispute" "$code" 200
[[ "$(psql_q "select status from public.disputes where id='$DSP_ID';")" == "closed" ]] || fail "dispute not closed"
ok "Dispute resolved and closed"

log "7 Chain integrity"
CUST_MATCH="$(psql_q "select count(*) from public.appointments a join public.invoices i on i.appointment_id=a.id join public.payments p on p.invoice_id=i.id where a.id='$APPT_ID' and a.customer_id='$CUSTOMER_ID' and i.customer_id='$CUSTOMER_ID' and p.customer_id='$CUSTOMER_ID' and a.business_id='$BUSINESS_ID' and i.business_id='$BUSINESS_ID';")"
[[ "$CUST_MATCH" == "1" ]] || fail "commercial chain mismatch"
ok "Same customer/business chain"
VEH_MATCH="$(psql_q "select vehicle_id from public.appointments where id='$APPT_ID';")"
[[ "$VEH_MATCH" == "$VEHICLE_ID" ]] || fail "vehicle mismatch"
ok "Same vehicle"
[[ "$(psql_q "select count(*) from public.payments where invoice_id='$INV_ID' and status='captured'")" == "1" ]] || fail "payment count"
ok "Single captured payment"
[[ "$(psql_q "select count(*) from public.reviews where eligibility_id='$ELIG_ID'")" == "1" ]] || fail "review dup"
ok "Single review"

log "Summary"; echo "PASS checks: $PASS"; echo "commercial_flow_e2e: PASS"
