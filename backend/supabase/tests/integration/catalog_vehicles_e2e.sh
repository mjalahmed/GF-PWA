#!/usr/bin/env bash
# Phase 4 catalog / vehicles / discovery authenticated e2e.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
API_BASE="${GARAGEFINDER_API_URL:-$SUPABASE_URL/functions/v1/api}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"
DB_HOST="${PGHOST:-127.0.0.1}"; DB_PORT="${PGPORT:-54322}"; DB_USER="${PGUSER:-postgres}"; DB_NAME="${PGDATABASE:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

OWNER_EMAIL="cv-owner@garagefinder.test"
CUSTOMER_EMAIL="cv-customer@garagefinder.test"
OTHER_EMAIL="cv-other@garagefinder.test"
TEST_PASSWORD="CatalogVehiclesE2E!local"
SLUG="cv-e2e-garage"
CR="CV-E2E-CR-001"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
PASS=0
log(){ printf '\n==> %s\n' "$*"; }
ok(){ printf '  PASS: %s\n' "$*"; PASS=$((PASS+1)); }
fail(){ printf '  FAIL: %s\n' "$*" >&2; exit 1; }
expect(){ local l="$1" a="$2"; shift 2; for e in "$@"; do [[ "$a" == "$e" ]] && { ok "$l (HTTP $a)"; return; }; done; fail "$l expected $* got $a body=$(head -c 400 "$TMP/body.json")"; }
denied(){ [[ "$2" =~ ^(401|403|404|409|422)$ ]] && ok "$1 (HTTP $2)" || fail "$1 expected denied got $2"; }
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

log "Health"
code="$(curl -sS -o "$TMP/h.json" -w "%{http_code}" "$API_BASE/v1/health" || true)"
[[ "$code" == "200" ]] || fail "API down — run make backend:serve"
ok "API healthy"; psql_q "select 1" >/dev/null; ok "DB reachable"

OWNER_ID="$(ensure_user "$OWNER_EMAIL" "CV Owner")"
CUSTOMER_ID="$(ensure_user "$CUSTOMER_EMAIL" "CV Customer")"
OTHER_ID="$(ensure_user "$OTHER_EMAIL" "CV Other")"
ok "Users ready"

CAT="$(psql_q "select id from public.business_categories where code='garage' limit 1;")"
SVC_CAT="$(psql_q "select id from public.service_categories where code='maintenance' limit 1;")"
PRD_CAT="$(psql_q "select id from public.product_categories where code='engine_oil' limit 1;")"
MAKE_ID="$(psql_q "select id from public.vehicle_makes where slug='toyota' limit 1;")"
MODEL_ID="$(psql_q "select id from public.vehicle_models where slug='camry' and make_id='$MAKE_ID' limit 1;")"

log "Seed business"
psql_q "
do \$\$
declare biz uuid; br uuid;
begin
  delete from public.favorites where business_id in (select id from public.businesses where slug='$SLUG' or commercial_registration_number='$CR');
  delete from public.service_vehicle_compatibility where service_id in (select id from public.services where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.product_vehicle_compatibility where product_id in (select id from public.products where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.inventory_adjustments where product_id in (select id from public.products where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.product_inventory where product_id in (select id from public.products where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.product_images where product_id in (select id from public.products where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.service_images where service_id in (select id from public.services where business_id in (select id from public.businesses where slug='$SLUG'));
  delete from public.products where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.services where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_opening_hours where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_branches where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_memberships where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.business_settings where business_id in (select id from public.businesses where slug='$SLUG');
  delete from public.businesses where slug='$SLUG' or commercial_registration_number='$CR';
  delete from public.vehicles where customer_id='$CUSTOMER_ID'::uuid;

  insert into public.businesses (slug, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, status, verification_status, approved_at)
  values ('$SLUG', '$CAT'::uuid, 'CV E2E WLL', 'CV E2E Garage', 'Catalog e2e', '$CR', '+97317220001', 'cv@garagefinder.test', 'active', 'verified', now())
  returning id into biz;
  insert into public.business_memberships (business_id, user_id, role, status, accepted_at)
  values (biz, '$OWNER_ID'::uuid, 'owner', 'active', now());
  insert into public.business_branches (business_id, name, address_line, city, area, country_code, latitude, longitude, is_primary, is_active)
  values (biz, 'Main', 'Road 1', 'Manama', 'Seef', 'BH', 26.23, 50.58, true, true) returning id into br;
  insert into public.business_opening_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select biz, d, case when d in (0,6) then null else '09:00'::time end, case when d in (0,6) then null else '18:00'::time end, d in (0,6)
  from generate_series(0,6) d;
end \$\$;
" >/dev/null
BUSINESS_ID="$(psql_q "select id from public.businesses where slug='$SLUG';")"
BRANCH_ID="$(psql_q "select id from public.business_branches where business_id='$BUSINESS_ID' and is_primary;")"
ok "Seeded business=$BUSINESS_ID"

OWNER_TOKEN="$(sign_in "$OWNER_EMAIL")"
CUSTOMER_TOKEN="$(sign_in "$CUSTOMER_EMAIL")"
OTHER_TOKEN="$(sign_in "$OTHER_EMAIL")"
ok "Tokens"

log "Owner catalog"
code="$(api POST "/v1/businesses/$BUSINESS_ID/services" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$SVC_CAT" '{categoryId:$c,name:"Oil Change",pricingType:"fixed",price:15,estimatedDurationMinutes:45,requiresAppointment:true,requiresVehicle:true}')")"
expect "Create service" "$code" 200 201
SERVICE_ID="$(json '.data.id')"

code="$(api POST "/v1/businesses/$BUSINESS_ID/products" "$OWNER_TOKEN" \
  "$(jq -n --arg c "$PRD_CAT" --arg b "$BRANCH_ID" '{categoryId:$c,branchId:$b,name:"Synthetic Oil 5W30",brand:"Castrol",price:12.5,stockStatus:"in_stock"}')")"
expect "Create product" "$code" 200 201
PRODUCT_ID="$(json '.data.id')"

code="$(api POST "/v1/businesses/$BUSINESS_ID/products/$PRODUCT_ID/inventory/adjust" "$OWNER_TOKEN" \
  "$(jq -n --arg b "$BRANCH_ID" '{branchId:$b,adjustmentType:"manual_add",quantityDelta:10,reason:"Initial stock"}')" \
  "Idempotency-Key: cv-inv-$PRODUCT_ID")"
expect "Inventory adjust" "$code" 200 201

code="$(api PUT "/v1/businesses/$BUSINESS_ID/services/$SERVICE_ID/compatibility" "$OWNER_TOKEN" \
  "$(jq -n --arg m "$MAKE_ID" --arg mo "$MODEL_ID" '{items:[{compatibilityType:"model",makeId:$m,modelId:$mo}]}')")"
expect "Service compatibility" "$code" 200

code="$(api PUT "/v1/businesses/$BUSINESS_ID/products/$PRODUCT_ID/compatibility" "$OWNER_TOKEN" \
  "$(jq -n --arg m "$MAKE_ID" '{items:[{compatibilityType:"make",makeId:$m}]}')")"
expect "Product compatibility" "$code" 200

log "Customer vehicles + discovery"
code="$(api POST /v1/vehicles "$CUSTOMER_TOKEN" \
  "$(jq -n --arg m "$MAKE_ID" --arg mo "$MODEL_ID" '{makeId:$m,modelId:$mo,year:2020}')")"
expect "Create vehicle" "$code" 200 201
VEHICLE_ID="$(json '.data.id')"

code="$(api POST "/v1/vehicles/$VEHICLE_ID/make-default" "$CUSTOMER_TOKEN" "{}")"
expect "Make default" "$code" 200

code="$(api GET "/v1/discovery/businesses?query=CV%20E2E&vehicleMakeId=$MAKE_ID&vehicleYear=2020&page=1&pageSize=20" "$CUSTOMER_TOKEN")"
expect "Discover with vehicle filter" "$code" 200
FOUND="$(jq -r --arg slug "$SLUG" '
  (.data | if type=="array" then . elif type=="object" then (.items // .businesses // .results // []) else [] end)
  | map(select(.slug==$slug)) | length
' "$TMP/body.json")"
[[ "$FOUND" -ge 1 ]] || fail "Business not found in discovery (body=$(head -c 300 "$TMP/body.json"))"
ok "Business appears in discovery"

code="$(api GET "/v1/discovery/businesses/$SLUG" "")"
expect "Public business by slug" "$code" 200
HAS_LEGAL="$(jq -r '.data|has("legalName")' "$TMP/body.json")"
HAS_EMAIL="$(jq -r '.data|has("email")' "$TMP/body.json")"
[[ "$HAS_LEGAL" == "false" && "$HAS_EMAIL" == "false" ]] || fail "Public DTO leaked private fields"
ok "Public DTO filtered"

code="$(api GET "/v1/discovery/businesses/$SLUG/services" "")"
expect "Public services" "$code" 200
code="$(api GET "/v1/discovery/businesses/$SLUG/products" "")"
expect "Public products" "$code" 200

code="$(api POST "/v1/favorites/$BUSINESS_ID" "$CUSTOMER_TOKEN" "{}")"
expect "Favorite business" "$code" 200 201

log "Denials + deactivation"
code="$(api GET "/v1/vehicles/$VEHICLE_ID" "$OTHER_TOKEN")"
denied "Cross-customer vehicle denied" "$code"

code="$(api POST "/v1/businesses/$BUSINESS_ID/services" "$CUSTOMER_TOKEN" \
  "$(jq -n --arg c "$SVC_CAT" '{categoryId:$c,name:"Hack",pricingType:"free",price:0}')")"
denied "Customer cannot create service" "$code"

code="$(api DELETE "/v1/businesses/$BUSINESS_ID/services/$SERVICE_ID" "$OWNER_TOKEN")"
expect "Deactivate service" "$code" 200
code="$(api GET "/v1/discovery/businesses/$SLUG/services" "")"
ACTIVE_SVC="$(jq -r --arg id "$SERVICE_ID" '
  (.data | if type=="array" then . elif type=="object" then (.items // .services // []) else [] end)
  | map(select(.id==$id)) | length
' "$TMP/body.json")"
[[ "$ACTIVE_SVC" == "0" ]] || fail "Inactive service still public"
ok "Inactive service hidden publicly"

code="$(api DELETE "/v1/businesses/$BUSINESS_ID/products/$PRODUCT_ID" "$OWNER_TOKEN")"
expect "Deactivate product" "$code" 200
code="$(api GET "/v1/discovery/businesses/$SLUG/products" "")"
ACTIVE_PRD="$(jq -r --arg id "$PRODUCT_ID" '
  (.data | if type=="array" then . elif type=="object" then (.items // .products // []) else [] end)
  | map(select(.id==$id)) | length
' "$TMP/body.json")"
[[ "$ACTIVE_PRD" == "0" ]] || fail "Inactive product still public"
ok "Inactive product hidden publicly"

AUDIT="$(psql_q "select count(*) from public.audit_logs where action in ('service.created','product.created','inventory.adjusted','vehicle.created','vehicle.default_changed') and created_at > now() - interval '1 hour';")"
[[ "$AUDIT" -ge 4 ]] || fail "Missing audit records ($AUDIT)"
ok "Audit records present"

log "Summary"; echo "PASS checks: $PASS"; echo "catalog_vehicles_e2e: PASS"
