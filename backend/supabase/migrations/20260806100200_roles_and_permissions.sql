-- Roles, permissions, and mappings
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger roles_set_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger permissions_set_updated_at
  before update on public.permissions
  for each row execute function public.set_updated_at();

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (role_id, permission_id)
);

create index role_permissions_role_id_idx on public.role_permissions (role_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, role_id)
);

create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_role_id_idx on public.user_roles (role_id);
