#!/usr/bin/env bash
# Phase 5 demo-data end-to-end verification.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

pass=0
fail() { echo "  FAIL: $*"; exit 1; }
ok() { echo "  PASS: $*"; pass=$((pass + 1)); }

echo "==> Health"
curl -sf http://127.0.0.1:54321/auth/v1/health >/dev/null || fail "Supabase not running"
ok "Supabase up"
curl -sf http://127.0.0.1:54321/functions/v1/api/v1/health >/dev/null || fail "API not serving — run make backend:serve"
ok "API healthy"

echo "==> Reset + seed"
make demo:users
ok "demo users"
make demo:seed
ok "demo seed"
make demo:verify
ok "demo verify"

echo "==> Idempotent re-seed"
make demo:seed
make demo:verify
ok "idempotent seed+verify"

echo "==> Counts via service SQL"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
do $$
declare
  biz int;
  svc int;
  prd int;
  veh int;
  fav int;
begin
  select count(*) into biz from public.businesses where slug like '%garagefinder%' or slug in (
    'pearl-motor-works','desert-torque-garage','harbour-auto-care',
    'lustre-lab-detailing','trackline-tyres','gulf-gear-parts'
  );
  if biz < 6 then raise exception 'biz %', biz; end if;
  select count(*) into svc from public.services s
    join public.businesses b on b.id = s.business_id
    where b.slug in (
      'pearl-motor-works','desert-torque-garage','harbour-auto-care',
      'lustre-lab-detailing','trackline-tyres','gulf-gear-parts'
    ) and s.is_active;
  if svc < 30 then raise exception 'svc %', svc; end if;
  select count(*) into prd from public.products p
    join public.businesses b on b.id = p.business_id
    where b.slug in (
      'pearl-motor-works','desert-torque-garage','harbour-auto-care',
      'lustre-lab-detailing','trackline-tyres','gulf-gear-parts'
    ) and p.is_active;
  if prd < 24 then raise exception 'prd %', prd; end if;
  select count(*) into veh from public.vehicles where registration_number like 'DEMO-%' and is_active;
  if veh < 10 then raise exception 'veh %', veh; end if;
  select count(*) into fav from public.favorites f
    join public.businesses b on b.id = f.business_id
    where b.slug in (
      'pearl-motor-works','desert-torque-garage','harbour-auto-care',
      'lustre-lab-detailing','trackline-tyres','gulf-gear-parts'
    );
  if fav < 8 then raise exception 'fav %', fav; end if;
end $$;
SQL
ok "SQL count gates"

echo "==> Cleanup safety (domain only)"
make demo:clean
# businesses should be gone
count="$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -Atc \
  "select count(*) from public.businesses where slug='pearl-motor-works'")"
[[ "$count" == "0" ]] || fail "pearl still present after clean"
ok "demo clean removed businesses"

# restore for developers who run e2e
make demo:users
make demo:seed
make demo:verify
ok "restored demo after clean"

echo
echo "==> Summary"
echo "PASS checks: $pass"
echo "demo_data_e2e: PASS"
