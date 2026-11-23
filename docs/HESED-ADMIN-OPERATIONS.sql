-- HESED ADMINISTRATIVO · Operación de cajas, conciliación y auditoría
-- Ejecutar DESPUÉS de docs/HESED-SUPABASE-SCHEMA.sql en Supabase SQL Editor.
-- No contiene claves privadas. No borrar registros históricos: las correcciones se registran como nuevos movimientos.

begin;

-- Los propietarios conservan platform_admin. Los demás usuarios reciben un rol por negocio.
alter table public.memberships drop constraint if exists memberships_role_check;
alter table public.memberships add constraint memberships_role_check
  check (role in ('manager','operator','viewer','receptionist','accountant'));

create or replace function public.can_manage_business(target_business uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select public.is_platform_admin() or exists(
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.business_id = target_business
      and m.role in ('manager','accountant')
  );
$$;

create or replace function public.can_run_cash(target_business uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select public.is_platform_admin() or exists(
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.business_id = target_business
      and m.role in ('manager','operator','accountant','receptionist')
  );
$$;


-- Permite a administración actualizar únicamente el nombre visible del personal.
drop policy if exists "profiles update by business managers" on public.profiles;
create policy "profiles update by business managers" on public.profiles
for update to authenticated using (
  public.is_platform_admin() or exists (
    select 1 from public.memberships m
    where m.user_id = profiles.user_id and public.can_manage_business(m.business_id)
  )
) with check (
  public.is_platform_admin() or exists (
    select 1 from public.memberships m
    where m.user_id = profiles.user_id and public.can_manage_business(m.business_id)
  )
);
revoke update on public.profiles from authenticated;
grant update(display_name) on public.profiles to authenticated;

-- Los responsables de un negocio pueden consultar los perfiles de sus compañeros.
drop policy if exists "profiles visible to same business" on public.profiles;
create policy "profiles visible to same business" on public.profiles
for select to authenticated using (
  user_id = auth.uid() or public.is_platform_admin() or exists (
    select 1 from public.memberships mine
    join public.memberships theirs on theirs.business_id = mine.business_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.user_id
  )
);

-- Los encargados pueden asignar roles dentro de su negocio. Un usuario no puede autoasignarse.
drop policy if exists "memberships visible to same business" on public.memberships;
create policy "memberships visible to same business" on public.memberships
for select to authenticated using (
  user_id = auth.uid() or public.is_platform_admin() or public.can_manage_business(business_id)
);

drop policy if exists "memberships manage by business admins" on public.memberships;
create policy "memberships manage by business admins" on public.memberships
for insert to authenticated with check (
  public.is_platform_admin() or (
    public.can_manage_business(business_id)
    and exists(select 1 from auth.users u where u.id = user_id)
    and role in ('manager','operator','viewer','receptionist','accountant')
  )
);
grant insert,update on public.memberships to authenticated;
drop policy if exists "memberships update by business admins" on public.memberships;
create policy "memberships update by business admins" on public.memberships
for update to authenticated using (
  public.is_platform_admin() or public.can_manage_business(business_id)
) with check (
  public.is_platform_admin() or public.can_manage_business(business_id)
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  opened_by uuid not null references auth.users(id),
  opened_by_name text not null default '',
  shift_name text not null,
  opening_cash numeric(12,2) not null default 0 check (opening_cash >= 0),
  opening_note text not null default '',
  status text not null default 'open' check (status in ('open','submitted','review','reconciled')),
  expected_cash numeric(12,2),
  counted_cash numeric(12,2),
  difference numeric(12,2),
  closing_note text not null default '',
  reviewed_by uuid references auth.users(id),
  review_note text not null default '',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  reconciled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint cash_session_close_fields check (
    status = 'open' or (closed_at is not null and expected_cash is not null and counted_cash is not null and difference is not null)
  )
);
create index if not exists cash_sessions_business_opened_idx on public.cash_sessions(business_id, opened_at desc);
create index if not exists cash_sessions_owner_status_idx on public.cash_sessions(opened_by, status);
create unique index if not exists cash_sessions_one_open_per_user_idx on public.cash_sessions(business_id, opened_by) where status='open';

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  session_id uuid not null references public.cash_sessions(id),
  created_by uuid not null references auth.users(id),
  kind text not null check (kind in ('income','expense','adjustment')),
  payment_method text not null check (payment_method in ('cash','card','transfer','other')),
  amount numeric(12,2) not null check (amount > 0),
  concept text not null,
  note text not null default '',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.cash_movements add column if not exists direction text not null default 'in';
alter table public.cash_movements drop constraint if exists cash_movements_direction_check;
alter table public.cash_movements add constraint cash_movements_direction_check check (direction in ('in','out'));

create index if not exists cash_movements_business_occurred_idx on public.cash_movements(business_id, occurred_at desc);
create index if not exists cash_movements_session_idx on public.cash_movements(session_id, occurred_at);

alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;

drop policy if exists "cash sessions read by business" on public.cash_sessions;
create policy "cash sessions read by business" on public.cash_sessions
for select to authenticated using (
  public.can_manage_business(business_id) or opened_by = auth.uid()
);

drop policy if exists "cash sessions open by assigned staff" on public.cash_sessions;
create policy "cash sessions open by assigned staff" on public.cash_sessions
for insert to authenticated with check (
  opened_by = auth.uid() and status = 'open' and public.can_run_cash(business_id)
);

drop policy if exists "cash sessions update by authorized users" on public.cash_sessions;
create policy "cash sessions update by authorized users" on public.cash_sessions
for update to authenticated using (
  public.can_manage_business(business_id) or (opened_by = auth.uid() and status = 'open')
) with check (
  public.can_manage_business(business_id) or (opened_by = auth.uid() and status = 'submitted')
);

drop policy if exists "cash movements read by business" on public.cash_movements;
create policy "cash movements read by business" on public.cash_movements
for select to authenticated using (
  public.can_manage_business(business_id) or exists (
    select 1 from public.cash_sessions s
    where s.id = session_id and s.opened_by = auth.uid()
  )
);

drop policy if exists "cash movements insert by session owner" on public.cash_movements;
create policy "cash movements insert by session owner" on public.cash_movements
for insert to authenticated with check (
  created_by = auth.uid()
  and public.can_run_cash(business_id)
  and exists (
    select 1 from public.cash_sessions s
    where s.id = session_id and s.business_id = cash_movements.business_id
      and s.opened_by = auth.uid() and s.status = 'open'
  )
);


-- Evidencias privadas de tickets y comprobantes.
create table if not exists public.cash_evidence (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  session_id uuid not null references public.cash_sessions(id),
  movement_id uuid references public.cash_movements(id),
  uploaded_by uuid not null references auth.users(id),
  object_path text not null unique,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  created_at timestamptz not null default now()
);
alter table public.cash_evidence enable row level security;
drop policy if exists "cash evidence read by authorized" on public.cash_evidence;
create policy "cash evidence read by authorized" on public.cash_evidence
for select to authenticated using (public.can_manage_business(business_id) or uploaded_by=auth.uid());
drop policy if exists "cash evidence insert by session owner" on public.cash_evidence;
create policy "cash evidence insert by session owner" on public.cash_evidence
for insert to authenticated with check (
  uploaded_by=auth.uid() and public.can_run_cash(business_id)
  and exists(select 1 from public.cash_sessions s where s.id=session_id and s.business_id=cash_evidence.business_id and s.opened_by=auth.uid())
);
grant select,insert on public.cash_evidence to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('hesed-evidence','hesed-evidence',false,15728640,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do nothing;
drop policy if exists "HESED evidence upload" on storage.objects;
create policy "HESED evidence upload" on storage.objects
for insert to authenticated with check (
  bucket_id='hesed-evidence'
  and public.can_run_cash((storage.foldername(name))[1]::uuid)
);
drop policy if exists "HESED evidence read" on storage.objects;
create policy "HESED evidence read" on storage.objects
for select to authenticated using (
  bucket_id='hesed-evidence'
  and public.can_access_business((storage.foldername(name))[1]::uuid)
);

-- Verifica el efectivo esperado en el servidor; no confía en el cálculo del navegador.
create or replace function public.guard_cash_session_update()
returns trigger language plpgsql security definer
set search_path = public
as $
declare
  expected numeric(12,2);
begin
  if public.is_platform_admin() or public.can_manage_business(old.business_id) then
    if old.status = 'reconciled' then
      raise exception 'Un corte conciliado no se modifica. Registra una aclaración.';
    end if;
    return new;
  end if;
  if old.opened_by <> auth.uid() or old.status <> 'open' or new.status <> 'submitted' then
    raise exception 'Solo puedes entregar tu propia caja abierta.';
  end if;
  if (to_jsonb(new) - array['status','expected_cash','counted_cash','difference','closing_note','closed_at'])
     <> (to_jsonb(old) - array['status','expected_cash','counted_cash','difference','closing_note','closed_at']) then
    raise exception 'No puedes modificar datos de apertura ni otros campos del corte.';
  end if;
  select old.opening_cash
    + coalesce(sum(case when (kind='income' or (kind='adjustment' and direction='in')) and payment_method='cash' then amount else 0 end),0)
    - coalesce(sum(case when (kind='expense' or (kind='adjustment' and direction='out')) and payment_method='cash' then amount else 0 end),0)
  into expected from public.cash_movements where session_id=old.id;
  if abs(coalesce(new.expected_cash,0)-expected)>0.01 then
    raise exception 'El efectivo esperado no coincide con los movimientos registrados.';
  end if;
  if abs(coalesce(new.difference,0)-(new.counted_cash-expected))>0.01 then
    raise exception 'La diferencia no coincide con el efectivo contado.';
  end if;
  if new.closed_at is null or new.expected_cash is null or new.counted_cash is null or new.difference is null then
    raise exception 'El corte requiere efectivo esperado, contado y diferencia.';
  end if;
  return new;
end;
$;

-- No se permite modificar ni borrar movimientos. Una corrección es un nuevo movimiento de ajuste.
create or replace function public.reject_cash_movement_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Los movimientos son inmutables. Registra un movimiento de ajuste.';
end;
$$;
drop trigger if exists cash_movements_no_update on public.cash_movements;
create trigger cash_movements_no_update before update or delete on public.cash_movements
for each row execute function public.reject_cash_movement_mutation();

-- Impide que una recepcionista altere la apertura o los importes después de entregar su corte.
create or replace function public.guard_cash_session_update()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if public.is_platform_admin() or public.can_manage_business(old.business_id) then
    if old.status = 'reconciled' then
      raise exception 'Un corte conciliado no se modifica. Registra una aclaración.';
    end if;
    return new;
  end if;
  if old.opened_by <> auth.uid() or old.status <> 'open' or new.status <> 'submitted' then
    raise exception 'Solo puedes entregar tu propia caja abierta.';
  end if;
  if (to_jsonb(new) - array['status','expected_cash','counted_cash','difference','closing_note','closed_at'])
     <> (to_jsonb(old) - array['status','expected_cash','counted_cash','difference','closing_note','closed_at']) then
    raise exception 'No puedes modificar datos de apertura ni otros campos del corte.';
  end if;
  if new.closed_at is null or new.expected_cash is null or new.counted_cash is null or new.difference is null then
    raise exception 'El corte requiere efectivo esperado, contado y diferencia.';
  end if;
  return new;
end;
$$;
drop trigger if exists cash_sessions_guard_update on public.cash_sessions;
create trigger cash_sessions_guard_update before update on public.cash_sessions
for each row execute function public.guard_cash_session_update();

-- Auditoría de cambios en sesiones y movimientos. Los registros de auditoría tampoco se pueden borrar.
create or replace function public.log_cash_audit()
returns trigger language plpgsql security definer
set search_path = public
as $audit$
declare
  bid uuid;
  ent_id text;
  act text;
  det jsonb;
begin
  if tg_op = 'DELETE' then
    bid := old.business_id; ent_id := old.id::text; act := 'delete'; det := to_jsonb(old);
  elsif tg_op = 'UPDATE' then
    bid := new.business_id; ent_id := new.id::text; act := 'update';
    det := jsonb_build_object('before',to_jsonb(old),'after',to_jsonb(new));
  else
    bid := new.business_id; ent_id := new.id::text; act := 'insert'; det := to_jsonb(new);
  end if;
  insert into public.audit_logs(business_id,actor_id,action,entity,entity_id,details)
  values(bid,auth.uid(),act,tg_table_name,ent_id,det);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$audit$;
drop trigger if exists cash_sessions_audit on public.cash_sessions;
create trigger cash_sessions_audit after insert or update on public.cash_sessions
for each row execute function public.log_cash_audit();
drop trigger if exists cash_movements_audit on public.cash_movements;
create trigger cash_movements_audit after insert on public.cash_movements
for each row execute function public.log_cash_audit();
drop trigger if exists memberships_audit on public.memberships;
create trigger memberships_audit after insert or update on public.memberships
for each row execute function public.log_cash_audit();
drop trigger if exists cash_evidence_audit on public.cash_evidence;
create trigger cash_evidence_audit after insert on public.cash_evidence
for each row execute function public.log_cash_audit();

create or replace function public.reject_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'El historial de auditoría es inmutable.';
end;
$$;
drop trigger if exists audit_logs_no_update_delete on public.audit_logs;
create trigger audit_logs_no_update_delete before update or delete on public.audit_logs
for each row execute function public.reject_audit_mutation();

grant select,insert,update on public.cash_sessions to authenticated;
grant select,insert on public.cash_movements to authenticated;
grant select,insert on public.cash_evidence to authenticated;
grant select,insert on public.audit_logs to authenticated;

-- Habilitar sincronización Realtime para cortes y movimientos.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='cash_sessions') then
      alter publication supabase_realtime add table public.cash_sessions;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='cash_movements') then
      alter publication supabase_realtime add table public.cash_movements;
    end if;
  end if;
end $$;

-- Conciliaciones de archivos Excel: se conserva el resultado de cada comparación.
create table if not exists public.excel_reconciliations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  uploaded_by uuid not null references auth.users(id),
  file_name text not null,
  period_month text not null,
  amount_column text not null,
  category text not null check (category in ('income','expense','all')),
  imported_total numeric(14,2) not null,
  hesed_total numeric(14,2) not null,
  difference numeric(14,2) not null,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.excel_reconciliations enable row level security;
drop policy if exists "excel reconciliations read by managers" on public.excel_reconciliations;
create policy "excel reconciliations read by managers" on public.excel_reconciliations
for select to authenticated using (public.can_manage_business(business_id));
drop policy if exists "excel reconciliations insert by managers" on public.excel_reconciliations;
create policy "excel reconciliations insert by managers" on public.excel_reconciliations
for insert to authenticated with check (uploaded_by=auth.uid() and public.can_manage_business(business_id));
grant select,insert on public.excel_reconciliations to authenticated;
drop trigger if exists excel_reconciliations_audit on public.excel_reconciliations;
create trigger excel_reconciliations_audit after insert on public.excel_reconciliations
for each row execute function public.log_cash_audit();
drop trigger if exists excel_reconciliations_no_update_delete on public.excel_reconciliations;
create trigger excel_reconciliations_no_update_delete before update or delete on public.excel_reconciliations
for each row execute function public.reject_audit_mutation();


-- Clasificación contable-operativa para que HESED analice conceptos comparables.
alter table public.cash_movements add column if not exists category text not null default 'Sin clasificar';
create index if not exists cash_movements_business_category_date_idx
  on public.cash_movements(business_id, category, occurred_at desc);

-- Historial de diagnósticos: conserva la fotografía analítica que se presentó a administración.
create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id),
  scope text not null check (scope in ('business','portfolio')),
  period_start date not null,
  period_end date not null,
  generated_by uuid not null references auth.users(id),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  constraint analytics_snapshot_scope_business check (
    (scope='business' and business_id is not null) or
    (scope='portfolio' and business_id is null)
  )
);
create index if not exists analytics_snapshots_business_created_idx
  on public.analytics_snapshots(business_id, created_at desc);
alter table public.analytics_snapshots enable row level security;
drop policy if exists "analytics snapshots read by managers" on public.analytics_snapshots;
create policy "analytics snapshots read by managers" on public.analytics_snapshots
for select to authenticated using (
  public.is_platform_admin() or (business_id is not null and public.can_manage_business(business_id))
);
drop policy if exists "analytics snapshots insert by managers" on public.analytics_snapshots;
create policy "analytics snapshots insert by managers" on public.analytics_snapshots
for insert to authenticated with check (
  generated_by=auth.uid() and (
    (scope='portfolio' and business_id is null and public.is_platform_admin()) or
    (scope='business' and business_id is not null and public.can_manage_business(business_id))
  )
);
grant select,insert on public.analytics_snapshots to authenticated;
drop trigger if exists analytics_snapshots_audit on public.analytics_snapshots;
create trigger analytics_snapshots_audit after insert on public.analytics_snapshots
for each row execute function public.log_cash_audit();
drop trigger if exists analytics_snapshots_no_update_delete on public.analytics_snapshots;
create trigger analytics_snapshots_no_update_delete before update or delete on public.analytics_snapshots
for each row execute function public.reject_audit_mutation();

commit;
