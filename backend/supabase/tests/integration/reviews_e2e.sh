#!/usr/bin/env bash
# Phase 9 verified reviews authenticated e2e.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"
DB_HOST="${PGHOST:-127.0.0.1}"; DB_PORT="${PGPORT:-54322}"; DB_USER="${PGUSER:-postgres}"; DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

OWNER_EMAIL="rev-owner@garagefinder.test"
CUSTOMER_EMAIL="rev-customer@garagefinder.test"
OTHER_EMAIL="rev-other@garagefinder.test"
ADMIN_EMAIL="rev-admin@garagefinder.test"
TEST_PASSWORD="ReviewsE2E!local"
SLUG="review-e2e-garage"
CR="REV-E2E-CR-001"
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
assert_num(){ python3 -c "import sys; a=float(sys.argv[1]); b=float(sys.argv[2]); assert abs(a-b)<0.001" "$1" "$2"; }

RATINGS_JSON='{"work_quality":5,"pricing_transparency":4,"timeliness":5,"customer_service":5,"overall_experience":5}'

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
  psql_q "
    insert into public.user_roles (user_id, role_id, assigned_by)
    select '$1'::uuid, r.id, '$1'::uuid from public.roles r where r.code='$2'
    on conflict do nothing;
  " >/dev/null
}

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

bump_slot(){
  python3 - <<PY
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
base = datetime.fromisoformat("$1").astimezone(bh).date() + timedelta(days=$2)
while base.weekday() >= 5:
    base += timedelta(days=1)
print(datetime(base.year, base.month, base.day, 11, 0, tzinfo=bh).isoformat())
PY
}

cleanup_and_seed(){
psql_q "
do \$\$
declare biz uuid; br uuid;
begin
  delete from public.review_moderation_events where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.review_reports where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
  delete from public.review_responses where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.review_ratings where review_id in (select id from public.reviews where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid,'$OTHER_ID'::uuid));
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
  delete from public.products where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.services where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_opening_hours where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_branches where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_memberships where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_settings where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.businesses where slug='$SLUG' or commercial_registration_number='$CR';
  delete from public.vehicles where customer_id='$CUSTOMER_ID'::uuid;

  insert into public.businesses (slug, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, status, verification_status, approved_at, average_rating, rating_count)
  values ('$SLUG', '$CAT'::uuid, 'Review E2E WLL', 'Review E2E Garage', 'Reviews e2e', '$CR', '+97317220009', 'review@garagefinder.test', 'active', 'verified', now(), 0, 0)
  returning id into biz;
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
  values (biz, '$OWNER_ID'::uuid, 'owner', 'active', now());
  insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
  values (biz, 'Main', 'Road 9', 'Manama', 'Seef', 'BH', 26.23, 50.58, true, true) returning id into br;
  insert into public.business_opening_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select biz, d, case when d in (0,6) then null else '09:00'::time end, case when d in (0,6) then null else '18:00'::time end, d in (0,6)
  from generate_series(0,6) d;
  update public.business_settings set
    appointments_enabled = true,
    quotations_enabled = true,
    invoices_enabled = true,
    cash_payments_enabled = true,
    reviews_enabled = true,
    auto_confirm_appointments = false,
    default_appointment_duration_minutes = 60,
    minimum_booking_notice_minutes = 0,
    maximum_booking_days_ahead = 90,
    cancellation_notice_minutes = 0
  where business_id = biz;
end \$\$;
" >/dev/null
}

create_service_vehicle(){
  code="$(api POST "/v1/businesses/$BUSINESS_ID/services" "$OWNER_TOKEN" \
    "$(jq -n --arg c "$SVC_CAT" '{categoryId:$c,name:"Brake Service",pricingType:"fixed",price:50,estimatedDurationMinutes:60,requiresAppointment:true}')")"
  expect "Create service" "$code" 200 201
  SERVICE_ID="$(json '.data.id')"
  code="$(api POST /v1/vehicles "$CUSTOMER_TOKEN" "$(jq -n '{makeText:"Nissan",modelText:"Altima",year:2021}')")"
  expect "Create vehicle" "$code" 200 201
  VEHICLE_ID="$(json '.data.id')"
}

book_and_start(){
  local slot="$1" key="$2"
  code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
    "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg v "$VEHICLE_ID" --arg t "$slot" \
      '{businessId:$b,branchId:$br,serviceId:$s,vehicleId:$v,scheduledStart:$t}')" \
    "Idempotency-Key: rev-appt-$key-$RUN_ID")"
  expect "Create appointment $key" "$code" 200 201
  APPT_ID="$(json '.data.id')"
  code="$(api POST "/v1/appointments/$APPT_ID/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: rev-confirm-$key-$RUN_ID")"
  expect "Confirm $key" "$code" 200
  code="$(api POST "/v1/appointments/$APPT_ID/arrive" "$OWNER_TOKEN" "{}" "Idempotency-Key: rev-arrive-$key-$RUN_ID")"
  expect "Arrive $key" "$code" 200
  code="$(api POST "/v1/appointments/$APPT_ID/start" "$OWNER_TOKEN" "{}" "Idempotency-Key: rev-start-$key-$RUN_ID")"
  expect "Start $key" "$code" 200
}

issue_pay_invoice_for_appt(){
  local key="$1" amount="${2:-50.000}" require_approval="${3:-false}"
  code="$(api POST "/v1/businesses/$BUSINESS_ID/appointments/$APPT_ID/invoice" "$OWNER_TOKEN" \
    "$(jq -n --arg s "$SERVICE_ID" --argjson req "$require_approval" --arg a "$amount" '{
      requiresCustomerApproval:$req,
      items:[{itemType:"service",serviceId:$s,description:"Brake Service",quantity:1,unitPrice:$a}]
    }')" \
    "Idempotency-Key: rev-inv-$key-$RUN_ID")"
  expect "Create invoice $key" "$code" 200 201
  INV_ID="$(json '.data.id')"
  code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_ID/issue" "$OWNER_TOKEN" "{}" "Idempotency-Key: rev-issue-$key-$RUN_ID")"
  expect "Issue invoice $key" "$code" 200
  if [[ "$require_approval" == "true" ]]; then
    code="$(api POST "/v1/invoices/$INV_ID/approve" "$CUSTOMER_TOKEN" "{}" "Idempotency-Key: rev-approve-$key-$RUN_ID")"
    expect "Approve invoice $key" "$code" 200
  fi
  code="$(api POST "/v1/businesses/$BUSINESS_ID/invoices/$INV_ID/payments/cash" "$OWNER_TOKEN" \
    "$(jq -n --arg a "$amount" '{amount:$a}')" "Idempotency-Key: rev-cash-$key-$RUN_ID")"
  expect "Cash pay $key" "$code" 200 201
}

log "Health"
code="$(curl -sS -o "$TMP/h.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
[[ "$code" == "200" ]] || fail "API down — run make backend:serve"
ok "API healthy"; psql_q "select 1" >/dev/null; ok "DB reachable"

OWNER_ID="$(ensure_user "$OWNER_EMAIL" "Review Owner")"
CUSTOMER_ID="$(ensure_user "$CUSTOMER_EMAIL" "Mustafa Ahmed")"
OTHER_ID="$(ensure_user "$OTHER_EMAIL" "Other Customer")"
ADMIN_ID="$(ensure_user "$ADMIN_EMAIL" "Review Admin")"
assign_role "$ADMIN_ID" "admin"
ok "Users ready"

CAT="$(psql_q "select id from public.business_categories where code='garage' limit 1;")"
SVC_CAT="$(psql_q "select id from public.service_categories where code='maintenance' limit 1;")"

log "Seed business"
cleanup_and_seed
BUSINESS_ID="$(psql_q "select id from public.businesses where slug='$SLUG';")"
BRANCH_ID="$(psql_q "select id from public.business_branches where business_id='$BUSINESS_ID' and is_primary;")"
ok "Seeded business=$BUSINESS_ID"

OWNER_TOKEN="$(sign_in "$OWNER_EMAIL")"
CUSTOMER_TOKEN="$(sign_in "$CUSTOMER_EMAIL")"
OTHER_TOKEN="$(sign_in "$OTHER_EMAIL")"
ADMIN_TOKEN="$(sign_in "$ADMIN_EMAIL")"
ok "Tokens"

create_service_vehicle
SLOT_A="$(next_weekday_slot)"

# ---------------------------------------------------------------------------
# Scenario A — pay then complete → eligibility → review → aggregate
# ---------------------------------------------------------------------------
log "Scenario A — pay then complete → review"
book_and_start "$SLOT_A" "a"
issue_pay_invoice_for_appt "a" "50.000" false
ELIG_COUNT="$(psql_q "select count(*) from public.review_eligibilities where invoice_id='$INV_ID';")"
[[ "$ELIG_COUNT" == "0" ]] || fail "eligibility should not exist before appointment completion ($ELIG_COUNT)"
ok "No eligibility before appointment completion"

code="$(api POST "/v1/appointments/$APPT_ID/complete" "$OWNER_TOKEN" "{}" "Idempotency-Key: rev-complete-a-$RUN_ID")"
expect "Complete appointment A" "$code" 200

ELIG_COUNT="$(psql_q "select count(*) from public.review_eligibilities where invoice_id='$INV_ID';")"
[[ "$ELIG_COUNT" == "1" ]] || fail "expected 1 eligibility got $ELIG_COUNT"
ok "Eligibility created after complete+paid"
ELIG_A="$(psql_q "select id from public.review_eligibilities where invoice_id='$INV_ID';")"

code="$(api GET "/v1/review-eligibilities/$ELIG_A" "$OTHER_TOKEN")"
denied "Wrong customer eligibility" "$code"

code="$(api GET "/v1/review-eligibilities?isUsed=false" "$CUSTOMER_TOKEN")"
expect "Customer list eligibilities" "$code" 200

code="$(api POST /v1/reviews "$CUSTOMER_TOKEN" \
  "$(jq -n --arg e "$ELIG_A" --argjson r "$RATINGS_JSON" '{eligibilityId:$e,overallRating:5,comment:"Great verified service",ratings:$r}')" \
  "Idempotency-Key: rev-create-a-$RUN_ID")"
expect "Create review A" "$code" 200 201
REVIEW_A="$(json '.data.id')"
[[ "$(json '.data.verified')" == "true" ]] || fail "expected verified true"
DISPLAY="$(json '.data.reviewerDisplayName')"
[[ "$DISPLAY" == "Mustafa A." ]] || fail "privacy display expected Mustafa A. got $DISPLAY"
ok "Verified review with privacy name=$DISPLAY"

AVG="$(psql_q "select average_rating::text from public.businesses where id='$BUSINESS_ID';")"
CNT="$(psql_q "select rating_count::text from public.businesses where id='$BUSINESS_ID';")"
assert_num "$AVG" 5
[[ "$CNT" == "1" ]] || fail "rating_count expected 1 got $CNT"
ok "Business aggregate updated avg=$AVG count=$CNT"

USED="$(psql_q "select is_used from public.review_eligibilities where id='$ELIG_A';")"
[[ "$USED" == "t" ]] || fail "eligibility not consumed"
ok "Eligibility consumed"

# ---------------------------------------------------------------------------
# Scenario B — complete first → pay later → one eligibility
# ---------------------------------------------------------------------------
log "Scenario B — complete first then pay"
SLOT_B="$(bump_slot "$SLOT_A" 1)"
book_and_start "$SLOT_B" "b"
code="$(api POST "/v1/appointments/$APPT_ID/complete" "$OWNER_TOKEN" "{}" "Idempotency-Key: rev-complete-b-$RUN_ID")"
expect "Complete B before pay" "$code" 200
ELIG_BEFORE="$(psql_q "select count(*) from public.review_eligibilities where appointment_id='$APPT_ID';")"
[[ "$ELIG_BEFORE" == "0" ]] || fail "eligibility should not exist before pay"
ok "No eligibility before pay (B)"
issue_pay_invoice_for_appt "b" "50.000" false
ELIG_B_COUNT="$(psql_q "select count(*) from public.review_eligibilities where invoice_id='$INV_ID';")"
[[ "$ELIG_B_COUNT" == "1" ]] || fail "expected 1 eligibility for B got $ELIG_B_COUNT"
ok "Exactly one eligibility after pay (B)"

# ---------------------------------------------------------------------------
# Scenario C — pay first → complete later → one eligibility (already A)
# Covered by A; assert calling ensure again is idempotent
# ---------------------------------------------------------------------------
log "Scenario C — idempotent ensure"
ELIG_C="$(psql_q "select public.ensure_review_eligibility('$INV_ID'::uuid, null, '$OWNER_ID'::uuid, null);")"
ELIG_C2="$(psql_q "select public.ensure_review_eligibility('$INV_ID'::uuid, null, '$OWNER_ID'::uuid, null);")"
[[ "$ELIG_C" == "$ELIG_C2" ]] || fail "ensure not idempotent"
COUNT_C="$(psql_q "select count(*) from public.review_eligibilities where invoice_id='$INV_ID';")"
[[ "$COUNT_C" == "1" ]] || fail "duplicate eligibility created"
ok "ensure_review_eligibility idempotent"

# ---------------------------------------------------------------------------
# Scenario D — second review denied
# ---------------------------------------------------------------------------
log "Scenario D — duplicate review denied"
code="$(api POST /v1/reviews "$CUSTOMER_TOKEN" \
  "$(jq -n --arg e "$ELIG_A" --argjson r "$RATINGS_JSON" '{eligibilityId:$e,overallRating:4,ratings:$r}')" \
  "Idempotency-Key: rev-create-a2-$RUN_ID")"
denied "Second review same eligibility" "$code"

# ---------------------------------------------------------------------------
# Scenario E — hide / restore aggregate
# ---------------------------------------------------------------------------
log "Scenario E — moderation aggregate"
code="$(api POST "/v1/admin/reviews/$REVIEW_A/hide" "$ADMIN_TOKEN" \
  '{"reason":"test hide"}' "Idempotency-Key: rev-hide-a-$RUN_ID")"
expect "Admin hide" "$code" 200
CNT="$(psql_q "select rating_count::text from public.businesses where id='$BUSINESS_ID';")"
[[ "$CNT" == "0" ]] || fail "hidden review should leave aggregate ($CNT)"
ok "Aggregate cleared after hide"

code="$(api GET "/v1/businesses/$BUSINESS_ID/reviews" "")"
expect "Public list after hide" "$code" 200
PUB_COUNT="$(jq -r 'if (.data|type)=="array" then (.data|length) elif (.data.items|type)=="array" then (.data.items|length) else 0 end' "$TMP/body.json")"
[[ "$PUB_COUNT" == "0" ]] || fail "hidden review still public ($PUB_COUNT)"
ok "Hidden review not public"

code="$(api POST "/v1/admin/reviews/$REVIEW_A/restore" "$ADMIN_TOKEN" \
  '{"reason":"test restore"}' "Idempotency-Key: rev-restore-a-$RUN_ID")"
expect "Admin restore" "$code" 200
CNT="$(psql_q "select rating_count::text from public.businesses where id='$BUSINESS_ID';")"
[[ "$CNT" == "1" ]] || fail "restore should restore aggregate ($CNT)"
ok "Aggregate restored"

# ---------------------------------------------------------------------------
# Scenario F — security denials
# ---------------------------------------------------------------------------
log "Scenario F — security"
code="$(api POST /v1/reviews "$OWNER_TOKEN" \
  "$(jq -n --arg e "$ELIG_A" --argjson r "$RATINGS_JSON" '{eligibilityId:$e,overallRating:5,ratings:$r}')" \
  "Idempotency-Key: rev-self-$RUN_ID")"
denied "Business self-review" "$code"

code="$(api POST /v1/reviews "$OTHER_TOKEN" \
  "$(jq -n --arg e "$ELIG_A" --argjson r "$RATINGS_JSON" '{eligibilityId:$e,overallRating:5,ratings:$r}')" \
  "Idempotency-Key: rev-wrong-$RUN_ID")"
denied "Wrong customer review" "$code"

code="$(api GET /v1/review-eligibilities "")"
denied "Anonymous eligibility" "$code"

code="$(api PATCH "/v1/reviews/$REVIEW_A" "$OWNER_TOKEN" \
  "$(jq -n --argjson r "$RATINGS_JSON" '{overallRating:1,ratings:$r}')")"
denied "Business edits customer review" "$code"

code="$(api POST "/v1/admin/reviews/$REVIEW_A/hide" "$CUSTOMER_TOKEN" "{\"reason\":\"no\"}")"
denied "Unauthorized moderate" "$code"

# Edit own review updates aggregate
code="$(api PATCH "/v1/reviews/$REVIEW_A" "$CUSTOMER_TOKEN" \
  "$(jq -n --argjson r "$RATINGS_JSON" '{overallRating:4,comment:"Updated",ratings:$r}')")"
expect "Edit own review" "$code" 200
AVG="$(psql_q "select average_rating::text from public.businesses where id='$BUSINESS_ID';")"
assert_num "$AVG" 4
ok "Aggregate updates after edit"

# Report
code="$(api POST "/v1/reviews/$REVIEW_A/report" "$OTHER_TOKEN" \
  '{"reasonCode":"spam","details":"looks fake"}' "Idempotency-Key: rev-report-$RUN_ID")"
expect "Report review" "$code" 200 201

AUDIT="$(psql_q "select count(*) from public.audit_logs where action like 'review.%' and created_at > now() - interval '1 hour';")"
[[ "$AUDIT" -ge 2 ]] || fail "Missing review audit ($AUDIT)"
ok "Audit records present ($AUDIT)"

log "Summary"; echo "PASS checks: $PASS"; echo "reviews_e2e: PASS"
