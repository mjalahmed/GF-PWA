-- Product inventory and adjustment history
create table public.product_inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  branch_id uuid not null references public.business_branches (id) on delete cascade,
  quantity_on_hand integer not null default 0,
  quantity_reserved integer not null default 0,
  reorder_level integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, branch_id),
  constraint product_inventory_qty_nonneg_check
    check (
      quantity_on_hand >= 0
      and quantity_reserved >= 0
      and reorder_level >= 0
      and quantity_reserved <= quantity_on_hand
    )
);

create index product_inventory_product_id_idx on public.product_inventory (product_id);
create index product_inventory_branch_id_idx on public.product_inventory (branch_id);

create trigger product_inventory_set_updated_at
  before update on public.product_inventory
  for each row execute function public.set_updated_at();

create type public.inventory_adjustment_type as enum (
  'manual_add',
  'manual_remove',
  'correction',
  'reservation',
  'reservation_release',
  'sale',
  'refund'
);

create table public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  branch_id uuid not null references public.business_branches (id) on delete cascade,
  adjustment_type public.inventory_adjustment_type not null,
  quantity_delta integer not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint inventory_adjustments_qty_check
    check (previous_quantity >= 0 and new_quantity >= 0)
);

create index inventory_adjustments_product_id_idx on public.inventory_adjustments (product_id);
create index inventory_adjustments_branch_id_idx on public.inventory_adjustments (branch_id);
create index inventory_adjustments_created_at_idx on public.inventory_adjustments (created_at desc);

-- Transactional inventory adjustment (Phase 4: manual_add / manual_remove / correction)
create or replace function public.adjust_product_inventory(
  p_product_id uuid,
  p_branch_id uuid,
  p_adjustment_type public.inventory_adjustment_type,
  p_quantity_delta integer,
  p_actor_user_id uuid,
  p_reason text default null,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_branch public.business_branches%rowtype;
  v_inv public.product_inventory%rowtype;
  v_prev integer;
  v_new integer;
  v_adj_id uuid;
begin
  if p_adjustment_type not in ('manual_add', 'manual_remove', 'correction') then
    raise exception 'UNSUPPORTED_ADJUSTMENT_TYPE' using errcode = 'P0001';
  end if;

  if p_quantity_delta = 0 then
    raise exception 'ZERO_DELTA' using errcode = 'P0001';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001'; end if;

  select * into v_branch from public.business_branches where id = p_branch_id;
  if not found or v_branch.business_id <> v_product.business_id then
    raise exception 'BRANCH_BUSINESS_MISMATCH' using errcode = 'P0001';
  end if;

  select * into v_inv
  from public.product_inventory
  where product_id = p_product_id and branch_id = p_branch_id
  for update;

  if not found then
    insert into public.product_inventory (product_id, branch_id, quantity_on_hand)
    values (p_product_id, p_branch_id, 0)
    returning * into v_inv;
  end if;

  v_prev := v_inv.quantity_on_hand;

  if p_adjustment_type = 'manual_add' then
    if p_quantity_delta < 0 then raise exception 'INVALID_DELTA' using errcode = 'P0001'; end if;
    v_new := v_prev + p_quantity_delta;
  elsif p_adjustment_type = 'manual_remove' then
    if p_quantity_delta < 0 then raise exception 'INVALID_DELTA' using errcode = 'P0001'; end if;
    v_new := v_prev - p_quantity_delta;
  else
    -- correction: delta is signed absolute change toward target semantics (delta applied as-is)
    v_new := v_prev + p_quantity_delta;
  end if;

  if v_new < 0 then
    raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001';
  end if;

  if v_inv.quantity_reserved > v_new then
    raise exception 'RESERVED_EXCEEDS_ON_HAND' using errcode = 'P0001';
  end if;

  update public.product_inventory
  set quantity_on_hand = v_new, updated_at = timezone('utc', now())
  where id = v_inv.id;

  insert into public.inventory_adjustments (
    product_id, branch_id, adjustment_type, quantity_delta,
    previous_quantity, new_quantity, reason, created_by
  ) values (
    p_product_id, p_branch_id, p_adjustment_type, p_quantity_delta,
    v_prev, v_new, p_reason, p_actor_user_id
  ) returning id into v_adj_id;

  perform public.write_audit_log(
    p_actor_user_id,
    'inventory.adjusted',
    'product_inventory',
    v_inv.id,
    null,
    null,
    p_reason,
    p_request_id,
    jsonb_build_object('quantity_on_hand', v_prev),
    jsonb_build_object('quantity_on_hand', v_new),
    jsonb_build_object(
      'product_id', p_product_id,
      'branch_id', p_branch_id,
      'adjustment_type', p_adjustment_type,
      'adjustment_id', v_adj_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'inventoryId', v_inv.id,
    'adjustmentId', v_adj_id,
    'previousQuantity', v_prev,
    'newQuantity', v_new
  );
end;
$$;

revoke all on function public.adjust_product_inventory(
  uuid, uuid, public.inventory_adjustment_type, integer, uuid, text, text
) from public;
grant execute on function public.adjust_product_inventory(
  uuid, uuid, public.inventory_adjustment_type, integer, uuid, text, text
) to service_role;
