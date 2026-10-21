-- HESED / Supabase PostgreSQL schema
-- Apply in Supabase SQL Editor after creating a dedicated project.
-- This schema creates isolated business data and server-enforced RLS.
begin;

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('shalom','befit','la-huerta')),
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.businesses (slug,name) values
 ('shalom','SHALOM'),('befit','BEFIT'),('la-huerta','LA HUERTA')
on conflict (slug) do nothing;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  platform_role text not null default 'user' check (platform_role in ('user','platform_admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null check (role in ('manager','operator','viewer')),
  created_at timestamptz not null default now(),
  unique(user_id,business_id)
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(business_id,name)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  campaign_id uuid,
  concept text not null,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  note text not null default '',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  channel text not null default 'Otro',
  budget numeric(12,2) not null default 0 check (budget >= 0),
  status text not null default 'planned' check (status in ('planned','active','paused','finished')),
  starts_on date,
  ends_on date,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.expenses drop constraint if exists expenses_campaign_id_fkey;
alter table public.expenses add constraint expenses_campaign_id_fkey
  foreign key (campaign_id) references public.campaigns(id) on delete set null;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  target_value numeric(14,2) not null default 0,
  current_value numeric(14,2) not null default 0,
  unit text not null default '',
  due_date date,
  status text not null default 'active' check (status in ('active','completed','paused')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.gym_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  member_code text,
  display_name text not null,
  plan text not null,
  status text not null default 'active' check (status in ('active','pending','inactive')),
  joined_on date not null default current_date,
  membership_ends_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  business_id uuid references public.businesses(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles p
    where p.user_id = auth.uid() and p.platform_role = 'platform_admin');
$$;

create or replace function public.can_access_business(target_business uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select public.is_platform_admin() or exists(
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.business_id = target_business
  );
$$;

create or replace function public.can_manage_business(target_business uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select public.is_platform_admin() or exists(
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.business_id = target_business
      and m.role in ('manager','operator')
  );
$$;

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.branches enable row level security;
alter table public.expenses enable row level security;
alter table public.campaigns enable row level security;
alter table public.goals enable row level security;
alter table public.gym_members enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "businesses visible to authorized members" on public.businesses;
create policy "businesses visible to authorized members" on public.businesses
for select to authenticated using (public.can_access_business(id));
drop policy if exists "profiles self or platform admin" on public.profiles;
create policy "profiles self or platform admin" on public.profiles
for select to authenticated using (user_id = auth.uid() or public.is_platform_admin());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and platform_role = 'user');
drop policy if exists "memberships visible to self or admin" on public.memberships;
create policy "memberships visible to self or admin" on public.memberships
for select to authenticated using (user_id = auth.uid() or public.is_platform_admin());
drop policy if exists "branches read by business" on public.branches;
create policy "branches read by business" on public.branches
for select to authenticated using (public.can_access_business(business_id));
drop policy if exists "branches write by business managers" on public.branches;
create policy "branches write by business managers" on public.branches
for all to authenticated using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));
drop policy if exists "expenses read by business" on public.expenses;
create policy "expenses read by business" on public.expenses
for select to authenticated using (public.can_access_business(business_id));
drop policy if exists "expenses write by business managers" on public.expenses;
create policy "expenses write by business managers" on public.expenses
for all to authenticated using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));
drop policy if exists "campaigns read by business" on public.campaigns;
create policy "campaigns read by business" on public.campaigns
for select to authenticated using (public.can_access_business(business_id));
drop policy if exists "campaigns write by business managers" on public.campaigns;
create policy "campaigns write by business managers" on public.campaigns
for all to authenticated using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));
drop policy if exists "goals read by business" on public.goals;
create policy "goals read by business" on public.goals
for select to authenticated using (public.can_access_business(business_id));
drop policy if exists "goals write by business managers" on public.goals;
create policy "goals write by business managers" on public.goals
for all to authenticated using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));
drop policy if exists "gym members read by befit access" on public.gym_members;
create policy "gym members read by befit access" on public.gym_members
for select to authenticated using (
  public.can_access_business(business_id) and
  exists(select 1 from public.businesses b where b.id = business_id and b.slug = 'befit')
);
drop policy if exists "gym members write by befit managers" on public.gym_members;
create policy "gym members write by befit managers" on public.gym_members
for all to authenticated using (
  public.can_manage_business(business_id) and
  exists(select 1 from public.businesses b where b.id = business_id and b.slug = 'befit')
) with check (
  public.can_manage_business(business_id) and
  exists(select 1 from public.businesses b where b.id = business_id and b.slug = 'befit')
);
drop policy if exists "audit logs read by authorized" on public.audit_logs;
create policy "audit logs read by authorized" on public.audit_logs
for select to authenticated using (business_id is not null and public.can_access_business(business_id) or public.is_platform_admin());
drop policy if exists "audit logs insert by authenticated" on public.audit_logs;
create policy "audit logs insert by authenticated" on public.audit_logs
for insert to authenticated with check (actor_id = auth.uid() and (business_id is null or public.can_access_business(business_id)));

grant usage on schema public to authenticated;
grant select on public.businesses, public.profiles, public.memberships to authenticated;
grant select,insert,update,delete on public.branches, public.expenses, public.campaigns, public.goals, public.gym_members to authenticated;
grant select,insert on public.audit_logs to authenticated;

-- User profile bootstrap; prevents signup from assigning privileged roles.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles(user_id, display_name, platform_role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''), 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- Administrative membership management is server-enforced.
drop policy if exists "platform admins manage memberships" on public.memberships;
create policy "platform admins manage memberships" on public.memberships
for all to authenticated using (public.is_platform_admin())
with check (public.is_platform_admin());
grant insert,update,delete on public.memberships to authenticated;

-- Ensure references do not cross business boundaries.
create or replace function public.enforce_same_business_references()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if new.branch_id is not null and not exists (
    select 1 from public.branches b
    where b.id = new.branch_id and b.business_id = new.business_id
  ) then
    raise exception 'branch_id must belong to the same business';
  end if;
  if new.campaign_id is not null and not exists (
    select 1 from public.campaigns c
    where c.id = new.campaign_id and c.business_id = new.business_id
  ) then
    raise exception 'campaign_id must belong to the same business';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_same_business_refs on public.expenses;
create trigger expenses_same_business_refs
before insert or update on public.expenses
for each row execute procedure public.enforce_same_business_references();

-- Agricultural records for LA HUERTA; Mi Parcela remains a separate frontend
-- until its current local data model is migrated and mapped deliberately.
create table if not exists public.farm_plots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  crop text not null default '',
  area numeric(12,2) check (area is null or area >= 0),
  area_unit text not null default 'ha',
  status text not null default 'active' check (status in ('active','resting','closed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(business_id,name)
);
create table if not exists public.farm_activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plot_id uuid not null references public.farm_plots(id) on delete cascade,
  activity_type text not null,
  activity_date date not null default current_date,
  notes text not null default '',
  cost numeric(12,2) not null default 0 check (cost >= 0),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create or replace function public.enforce_farm_plot_business()
returns trigger language plpgsql
set search_path = public
as $$
begin
  if not exists (select 1 from public.farm_plots p where p.id = new.plot_id and p.business_id = new.business_id) then
    raise exception 'plot_id must belong to the same business';
  end if;
  return new;
end;
$$;
drop trigger if exists farm_activity_same_business on public.farm_activities;
create trigger farm_activity_same_business
before insert or update on public.farm_activities
for each row execute procedure public.enforce_farm_plot_business();

alter table public.farm_plots enable row level security;
alter table public.farm_activities enable row level security;
drop policy if exists "farm plots read by business" on public.farm_plots;
create policy "farm plots read by business" on public.farm_plots
for select to authenticated using (
  public.can_access_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='la-huerta')
);
drop policy if exists "farm plots write by business managers" on public.farm_plots;
create policy "farm plots write by business managers" on public.farm_plots
for all to authenticated using (
  public.can_manage_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='la-huerta')
) with check (
  public.can_manage_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='la-huerta')
);
drop policy if exists "farm activities read by business" on public.farm_activities;
create policy "farm activities read by business" on public.farm_activities
for select to authenticated using (
  public.can_access_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='la-huerta')
);
drop policy if exists "farm activities write by business managers" on public.farm_activities;
create policy "farm activities write by business managers" on public.farm_activities
for all to authenticated using (
  public.can_manage_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='la-huerta')
) with check (
  public.can_manage_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='la-huerta')
);
grant select,insert,update,delete on public.farm_plots, public.farm_activities to authenticated;

-- Restaurant reservation records; payment processing is intentionally absent.
create table if not exists public.shalom_reservations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  customer_name text not null,
  customer_phone text not null default '',
  party_size integer not null check (party_size between 1 and 30),
  reservation_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested','confirmed','cancelled','completed')),
  notes text not null default '',
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  check (business_id is not null)
);
alter table public.shalom_reservations enable row level security;
drop policy if exists "shalom reservations read by business" on public.shalom_reservations;
create policy "shalom reservations read by business" on public.shalom_reservations
for select to authenticated using (
  public.can_access_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='shalom')
);
drop policy if exists "shalom reservations manage by business managers" on public.shalom_reservations;
create policy "shalom reservations manage by business managers" on public.shalom_reservations
for all to authenticated using (
  public.can_manage_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='shalom')
) with check (
  public.can_manage_business(business_id) and
  exists(select 1 from public.businesses b where b.id=business_id and b.slug='shalom')
);
grant select,insert,update,delete on public.shalom_reservations to authenticated;


-- Enable Postgres Changes for records that should refresh across owners' devices.
-- Supabase projects normally provide the supabase_realtime publication.
do $
declare
  tbl text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach tbl in array array[
      'branches','expenses','campaigns','goals','gym_members',
      'farm_plots','farm_activities','shalom_reservations'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = tbl
      ) then
        execute format('alter publication supabase_realtime add table public.%I', tbl);
      end if;
    end loop;
  else
    raise notice 'Publication supabase_realtime was not found; enable Realtime for required tables in Supabase Dashboard.';
  end if;
end;
$$;

commit;
