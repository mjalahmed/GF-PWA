-- Customer vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  make_id uuid references public.vehicle_makes (id) on delete set null,
  model_id uuid references public.vehicle_models (id) on delete set null,
  make_text text,
  model_text text,
  year integer not null,
  trim text,
  engine text,
  vin text,
  registration_number text,
  color text,
  mileage integer,
  mileage_unit text not null default 'km',
  image_path text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vehicles_year_check
    check (year >= 1950 and year <= extract(year from timezone('utc', now()))::integer + 1),
  constraint vehicles_mileage_nonneg_check
    check (mileage is null or mileage >= 0),
  constraint vehicles_mileage_unit_check
    check (mileage_unit in ('km', 'mi')),
  constraint vehicles_identity_check
    check (
      make_id is not null
      or nullif(btrim(coalesce(make_text, '')), '') is not null
    )
);

create index vehicles_customer_id_idx on public.vehicles (customer_id);
create index vehicles_customer_active_idx on public.vehicles (customer_id, is_active);
create unique index vehicles_one_default_active_uidx
  on public.vehicles (customer_id)
  where is_default = true and is_active = true;

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create or replace function public.make_vehicle_default(
  p_vehicle_id uuid,
  p_customer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle public.vehicles%rowtype;
begin
  select * into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
  for update;

  if not found then
    raise exception 'VEHICLE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_vehicle.customer_id <> p_customer_id then
    raise exception 'VEHICLE_ACCESS_DENIED' using errcode = 'P0001';
  end if;

  if v_vehicle.is_active is not true then
    raise exception 'VEHICLE_INACTIVE' using errcode = 'P0001';
  end if;

  update public.vehicles
  set is_default = false, updated_at = timezone('utc', now())
  where customer_id = p_customer_id
    and is_default = true
    and id <> p_vehicle_id;

  update public.vehicles
  set is_default = true, updated_at = timezone('utc', now())
  where id = p_vehicle_id;

  perform public.write_audit_log(
    p_customer_id,
    'vehicle.default_changed',
    'vehicle',
    p_vehicle_id,
    null,
    null,
    null,
    null,
    null,
    jsonb_build_object('customer_id', p_customer_id)
  );

  return jsonb_build_object('success', true, 'vehicleId', p_vehicle_id);
end;
$$;

revoke all on function public.make_vehicle_default(uuid, uuid) from public;
grant execute on function public.make_vehicle_default(uuid, uuid) to service_role;
