#!/usr/bin/env bash
# Phase 6 appointments authenticated e2e.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"
DB_HOST="${PGHOST:-127.0.0.1}"; DB_PORT="${PGPORT:-54322}"; DB_USER="${PGUSER:-postgres}"; DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

OWNER_EMAIL="appt-owner@garagefinder.test"
CUSTOMER_EMAIL="appt-customer@garagefinder.test"
OTHER_EMAIL="appt-other@garagefinder.test"
TEST_PASSWORD="AppointmentsE2E!local"
SLUG="appt-e2e-garage"
CR="APPT-E2E-CR-001"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
PASS=0
RUN_ID="$(date +%s)-$$"
log(){ printf '\n==> %s\n' "$*"; }
ok(){ printf '  PASS: %s\n' "$*"; PASS=$((PASS+1)); }
fail(){ printf '  FAIL: %s\n' "$*" >&2; exit 1; }
expect(){ local l="$1" a="$2"; shift 2; for e in "$@"; do [[ "$a" == "$e" ]] && { ok "$l (HTTP $a)"; return; }; done; fail "$l expected $* got $a body=$(head -c 400 "$TMP/body.json")"; }
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
start = datetime(d.year, d.month, d.day, 10, 0, tzinfo=bh)
print(start.isoformat())
print(d.isoformat())
PY
}

log "Health"
code="$(curl -sS -o "$TMP/h.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
[[ "$code" == "200" ]] || fail "API down — run make backend:serve"
ok "API healthy"; psql_q "select 1" >/dev/null; ok "DB reachable"

OWNER_ID="$(ensure_user "$OWNER_EMAIL" "Appt Owner")"
CUSTOMER_ID="$(ensure_user "$CUSTOMER_EMAIL" "Appt Customer")"
OTHER_ID="$(ensure_user "$OTHER_EMAIL" "Appt Other")"
ok "Users ready"

CAT="$(psql_q "select id from public.business_categories where code='garage' limit 1;")"
SVC_CAT="$(psql_q "select id from public.service_categories where code='maintenance' limit 1;")"

log "Seed business"
psql_q "
do \$\$
declare biz uuid; br uuid;
begin
  delete from public.appointment_notes where appointment_id in (select id from public.appointments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.appointment_status_history where appointment_id in (select id from public.appointments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.appointment_services where appointment_id in (select id from public.appointments where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.appointments where business_id in (select id from public.businesses where slug='$SLUG') or customer_id in ('$CUSTOMER_ID'::uuid, '$OTHER_ID'::uuid);
  delete from public.services where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_opening_hours where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_closure_dates where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_branches where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_memberships where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_settings where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.businesses where slug='$SLUG' or commercial_registration_number='$CR';
  delete from public.vehicles where customer_id='$CUSTOMER_ID'::uuid;

  insert into public.businesses (slug, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, status, verification_status, approved_at)
  values ('$SLUG', '$CAT'::uuid, 'Appt E2E WLL', 'Appt E2E Garage', 'Appointments e2e', '$CR', '+97317220002', 'appt@garagefinder.test', 'active', 'verified', now())
  returning id into biz;
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
  values (biz, '$OWNER_ID'::uuid, 'owner', 'active', now());
  insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
  values (biz, 'Main', 'Road 2', 'Manama', 'Seef', 'BH', 26.23, 50.58, true, true) returning id into br;
  insert into public.business_opening_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select biz, d, case when d in (0,6) then null else '09:00'::time end, case when d in (0,6) then null else '18:00'::time end, d in (0,6)
  from generate_series(0,6) d;
  update public.business_settings set
    appointments_enabled = true,
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

log "Create service + vehicle"
code="$(api POST "/v1/businesses/$BUSINESS_ID/services" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$SVC_CAT" '{categoryId:$c,name:"Brake Check",pricingType:"fixed",price:25,estimatedDurationMinutes:60,requiresAppointment:true}')")"
expect "Create service" "$code" 200 201
SERVICE_ID="$(json '.data.id')"

code="$(api POST /v1/vehicles "$CUSTOMER_TOKEN" \
  "$(jq -n '{makeText:"Toyota",modelText:"Camry",year:2021}')")"
expect "Create vehicle" "$code" 200 201
VEHICLE_ID="$(json '.data.id')"

SLOT_RAW="$(next_weekday_slot)"
SCHEDULE_START="$(printf '%s
' "$SLOT_RAW" | sed -n '1p')"
SCHEDULE_DATE="$(printf '%s
' "$SLOT_RAW" | sed -n '2p')"
ok "Slot candidate $SCHEDULE_START"

log "Slots endpoint"
code="$(api GET "/v1/businesses/$BUSINESS_ID/branches/$BRANCH_ID/appointment-slots?date=$SCHEDULE_DATE&serviceId=$SERVICE_ID" "$CUSTOMER_TOKEN")"
expect "List slots" "$code" 200
SLOT_COUNT="$(jq -r '.data.slots|length' "$TMP/body.json")"
[[ "$SLOT_COUNT" -ge 1 ]] || fail "Expected available slots"
# Prefer 10:00 Bahrain if present, else first slot
SCHEDULE_START="$(jq -r --arg pref "$SCHEDULE_START" '
  (.data.slots // []) as $s
  | ($s | map(select(.start==$pref)) | .[0].start)
  // ($s[0].start)
' "$TMP/body.json")"
ok "Using start $SCHEDULE_START"

log "Happy path request → confirm → arrive → start → complete"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg v "$VEHICLE_ID" --arg t "$SCHEDULE_START" \
    '{businessId:$b,branchId:$br,serviceId:$s,vehicleId:$v,scheduledStart:$t,customerNotes:"e2e"}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-1-$RUN_ID")"
expect "Create appointment" "$code" 200 201
APPT_ID="$(json '.data.id')"
STATUS="$(json '.data.status')"
[[ "$STATUS" == "requested" ]] || fail "Expected requested got $STATUS"
ok "Requested $APPT_ID"

code="$(api GET "/v1/appointments/$APPT_ID" "$OTHER_TOKEN")"
denied "Cross-customer get denied" "$code"

code="$(api POST "/v1/appointments/$APPT_ID/complete" "$CUSTOMER_TOKEN" "{}")"
denied "Customer cannot complete" "$code"

code="$(api POST "/v1/appointments/$APPT_ID/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: appt-confirm-$APPT_ID-$RUN_ID")"
expect "Confirm" "$code" 200
[[ "$(json '.data.status')" == "confirmed" ]] || fail "not confirmed"

code="$(api POST "/v1/appointments/$APPT_ID/arrive" "$OWNER_TOKEN" "{}" "Idempotency-Key: appt-arrive-$APPT_ID-$RUN_ID")"
expect "Arrive" "$code" 200
[[ "$(json '.data.status')" == "customer_arrived" ]] || fail "not arrived"

code="$(api POST "/v1/appointments/$APPT_ID/start" "$OWNER_TOKEN" "{}" "Idempotency-Key: appt-start-$APPT_ID-$RUN_ID")"
expect "Start" "$code" 200
[[ "$(json '.data.status')" == "in_progress" ]] || fail "not in_progress"

code="$(api POST "/v1/appointments/$APPT_ID/complete" "$OWNER_TOKEN" "{}" "Idempotency-Key: appt-complete-$APPT_ID-$RUN_ID")"
expect "Complete" "$code" 200
[[ "$(json '.data.status')" == "completed" ]] || fail "not completed"

code="$(api POST "/v1/appointments/$APPT_ID/confirm" "$OWNER_TOKEN" "{}")"
denied "Invalid transition after complete" "$code"

log "Reject flow"
REJ_START="$(python3 - <<PY
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
d = datetime.fromisoformat("${SCHEDULE_DATE}").date()
start = datetime(d.year, d.month, d.day, 11, 0, tzinfo=bh)
print(start.isoformat())
PY
)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg t "$REJ_START" \
    '{businessId:$b,branchId:$br,serviceId:$s,scheduledStart:$t}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-rej-$RUN_ID")"
expect "Create for reject" "$code" 200 201
REJ_ID="$(json '.data.id')"
code="$(api POST "/v1/appointments/$REJ_ID/reject" "$OWNER_TOKEN" '{"reason":"busy"}' "Idempotency-Key: appt-reject-$REJ_ID-$RUN_ID")"
expect "Reject" "$code" 200
[[ "$(json '.data.status')" == "rejected" ]] || fail "not rejected"

log "Cancel + no-show flows"
CAN_START="$(python3 - <<PY
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
d = datetime.fromisoformat("${SCHEDULE_DATE}").date()
start = datetime(d.year, d.month, d.day, 12, 0, tzinfo=bh)
print(start.isoformat())
PY
)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg t "$CAN_START" \
    '{businessId:$b,branchId:$br,serviceId:$s,scheduledStart:$t}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-can-$RUN_ID")"
expect "Create for cancel" "$code" 200 201
CAN_ID="$(json '.data.id')"
code="$(api POST "/v1/appointments/$CAN_ID/cancel" "$CUSTOMER_TOKEN" '{"reason":"change of plans"}' "Idempotency-Key: appt-cancel-$CAN_ID-$RUN_ID")"
expect "Customer cancel" "$code" 200
[[ "$(json '.data.status')" == "cancelled_by_customer" ]] || fail "not cancelled_by_customer"

NS_START="$(python3 - <<PY
from datetime import datetime, timedelta, timezone
bh = timezone(timedelta(hours=3))
d = datetime.fromisoformat("${SCHEDULE_DATE}").date()
start = datetime(d.year, d.month, d.day, 13, 0, tzinfo=bh)
print(start.isoformat())
PY
)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg t "$NS_START" \
    '{businessId:$b,branchId:$br,serviceId:$s,scheduledStart:$t}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-ns-$RUN_ID")"
expect "Create for no-show" "$code" 200 201
NS_ID="$(json '.data.id')"
code="$(api POST "/v1/appointments/$NS_ID/confirm" "$OWNER_TOKEN" "{}" "Idempotency-Key: appt-confirm-$NS_ID-$RUN_ID")"
expect "Confirm for no-show" "$code" 200
code="$(api POST "/v1/appointments/$NS_ID/no-show" "$OWNER_TOKEN" "{}" "Idempotency-Key: appt-noshow-$NS_ID-$RUN_ID")"
expect "No-show" "$code" 200
[[ "$(json '.data.status')" == "no_show" ]] || fail "not no_show"

log "Conflict + outside hours + closure"
CF_START="$SCHEDULE_START"
# Create another appointment at occupied 10:00 after we completed the first —
# completed is terminal so slot is free; create a live booking then conflict.
LIVE_START="$(python3 - <<PY
from datetime import datetime, timezone, timedelta
bh = timezone(timedelta(hours=3))
d = datetime.fromisoformat("${SCHEDULE_DATE}").date() + timedelta(days=1)
while d.weekday() >= 5:
    d += timedelta(days=1)
print(datetime(d.year, d.month, d.day, 10, 0, tzinfo=bh).isoformat())
print(d.isoformat())
PY
)"
LIVE_TS="$(printf '%s
' "$LIVE_START" | sed -n '1p')"
LIVE_DATE="$(printf '%s
' "$LIVE_START" | sed -n '2p')"

code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg t "$LIVE_TS" \
    '{businessId:$b,branchId:$br,serviceId:$s,scheduledStart:$t}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-live-$RUN_ID")"
expect "Create live booking" "$code" 200 201
LIVE_ID="$(json '.data.id')"

code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg t "$LIVE_TS" \
    '{businessId:$b,branchId:$br,serviceId:$s,scheduledStart:$t}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-conflict-$RUN_ID")"
denied "Conflict denied" "$code"
CODE_BODY="$(jq -r '.error.code // empty' "$TMP/body.json")"
[[ "$CODE_BODY" == "APPOINTMENT_CONFLICT" || "$code" =~ ^(409|422)$ ]] || fail "Expected APPOINTMENT_CONFLICT got $CODE_BODY"

OUTSIDE="$(python3 - <<PY
from datetime import datetime, timezone, timedelta
bh = timezone(timedelta(hours=3))
d = datetime.fromisoformat("${LIVE_DATE}").date()
print(datetime(d.year, d.month, d.day, 22, 0, tzinfo=bh).isoformat())
PY
)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg t "$OUTSIDE" \
    '{businessId:$b,branchId:$br,serviceId:$s,scheduledStart:$t}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-outside-$RUN_ID")"
denied "Outside hours denied" "$code"

psql_q "insert into public.business_closure_dates (business_id, branch_id, closure_date, is_full_day, created_by)
  values ('$BUSINESS_ID'::uuid, '$BRANCH_ID'::uuid, '$LIVE_DATE'::date + 7, true, '$OWNER_ID'::uuid);" >/dev/null
CLOSURE_DATE="$(python3 - <<PY
from datetime import datetime, timedelta
d = datetime.fromisoformat("${LIVE_DATE}").date() + timedelta(days=7)
# ensure weekday for hours check path — closure overrides
print(d.isoformat())
print(datetime(d.year, d.month, d.day, 10, 0).replace(tzinfo=__import__('datetime').timezone(timedelta(hours=3))).isoformat())
PY
)"
CL_DATE="$(printf '%s
' "$CLOSURE_DATE" | sed -n '1p')"
CL_TS="$(printf '%s
' "$CLOSURE_DATE" | sed -n '2p')"
# Fix closure date to exact CL_DATE
psql_q "delete from public.business_closure_dates where business_id='$BUSINESS_ID' and closure_date='$CL_DATE'::date;
insert into public.business_closure_dates (business_id, branch_id, closure_date, is_full_day, created_by)
values ('$BUSINESS_ID'::uuid, '$BRANCH_ID'::uuid, '$CL_DATE'::date, true, '$OWNER_ID'::uuid);" >/dev/null
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg t "$CL_TS" \
    '{businessId:$b,branchId:$br,serviceId:$s,scheduledStart:$t}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-closure-$RUN_ID")"
denied "Closure date denied" "$code"

log "Inactive business"
psql_q "update public.businesses set status='suspended' where id='$BUSINESS_ID';" >/dev/null
INACTIVE_TS="$(python3 - <<PY
from datetime import datetime, timezone, timedelta
bh = timezone(timedelta(hours=3))
d = datetime.fromisoformat("${LIVE_DATE}").date() + timedelta(days=14)
while d.weekday() >= 5:
    d += timedelta(days=1)
print(datetime(d.year, d.month, d.day, 10, 0, tzinfo=bh).isoformat())
PY
)"
code="$(api POST /v1/appointments "$CUSTOMER_TOKEN" \
  "$(jq -n --arg b "$BUSINESS_ID" --arg br "$BRANCH_ID" --arg s "$SERVICE_ID" --arg t "$INACTIVE_TS" \
    '{businessId:$b,branchId:$br,serviceId:$s,scheduledStart:$t}')" \
  "Idempotency-Key: appt-create-$CUSTOMER_ID-inactive-$RUN_ID")"
denied "Inactive business denied" "$code"
psql_q "update public.businesses set status='active' where id='$BUSINESS_ID';" >/dev/null

log "Business list"
code="$(api GET "/v1/businesses/$BUSINESS_ID/appointments" "$OWNER_TOKEN")"
expect "Business list" "$code" 200
LIST_LEN="$(jq -r '.data|length' "$TMP/body.json")"
[[ "$LIST_LEN" -ge 1 ]] || fail "Expected appointments in business list"

code="$(api GET /v1/appointments "$CUSTOMER_TOKEN")"
expect "Customer list" "$code" 200

NOTIFS="$(psql_q "select count(*) from public.notifications where entity_type='appointment' and user_id='$CUSTOMER_ID';")"
[[ "$NOTIFS" -ge 1 ]] || fail "Expected in-app notifications ($NOTIFS)"
ok "Notifications present ($NOTIFS)"

AUDIT="$(psql_q "select count(*) from public.audit_logs where action like 'appointment.%' and created_at > now() - interval '1 hour';")"
[[ "$AUDIT" -ge 3 ]] || fail "Missing appointment audit ($AUDIT)"
ok "Audit records present ($AUDIT)"

log "Summary"; echo "PASS checks: $PASS"; echo "appointments_e2e: PASS"
