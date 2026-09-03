-- Saturday Football Fund Manager
-- Run this entire file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

-- Application roles are separate from Supabase's authenticated/anon database roles.
do $$
begin
  create type public.app_role as enum ('admin', 'treasurer', 'player');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  role public.app_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  phone text,
  player_type text not null default 'Regular' check (player_type in ('Regular', 'Occasional', 'Boss / Sponsor', 'Guest')),
  default_contribution numeric(12, 2) not null default 200 check (default_contribution >= 0),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  match_date date not null,
  start_time time not null default '07:00',
  end_time time not null default '08:00',
  turf_name text not null,
  match_cost numeric(12, 2) not null default 1000 check (match_cost >= 0),
  status text not null default 'Planned' check (status in ('Planned', 'Booked', 'Completed', 'Cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  constraint valid_match_time check (end_time > start_time)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  attendance_status text not null default 'Joined' check (attendance_status in ('Joined', 'Not Joined', 'Maybe')),
  expected_contribution numeric(12, 2) not null default 200 check (expected_contribution >= 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0),
  payment_status text not null default 'Due' check (payment_status in ('Paid', 'Partial', 'Due', 'Extra Paid')),
  notes text,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete set null,
  player_id uuid not null references public.players(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  contribution_type text not null default 'Regular Player Fee' check (contribution_type in ('Regular Player Fee', 'Extra Support', 'Advance Fund', 'Adjustment')),
  payment_method text not null default 'Cash' check (payment_method in ('Cash', 'bKash', 'Nagad', 'Bank', 'Other')),
  payment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete set null,
  expense_type text not null default 'Turf Fee' check (expense_type in ('Turf Fee', 'Ball', 'Water', 'Transport', 'Other')),
  amount numeric(12, 2) not null check (amount > 0),
  paid_by uuid references public.players(id) on delete set null,
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  default_match_cost numeric(12, 2) not null default 1000 check (default_match_cost >= 0),
  default_player_contribution numeric(12, 2) not null default 200 check (default_player_contribution >= 0),
  default_turf_name text not null default 'Green Field Arena',
  default_start_time time not null default '07:00',
  default_end_time time not null default '08:00',
  currency text not null default 'BDT',
  constraint valid_default_time check (default_end_time > default_start_time)
);

alter table public.profiles add column if not exists player_id uuid;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_player_id_fkey' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles
      add constraint profiles_player_id_fkey foreign key (player_id) references public.players(id) on delete set null;
  end if;
end $$;
create unique index if not exists profiles_player_id_unique on public.profiles (player_id) where player_id is not null;

create index if not exists matches_date_idx on public.matches (match_date desc);
create index if not exists attendance_match_idx on public.attendance (match_id);
create index if not exists attendance_player_idx on public.attendance (player_id);
create index if not exists contributions_match_idx on public.contributions (match_id);
create index if not exists contributions_player_idx on public.contributions (player_id);
create index if not exists contributions_date_idx on public.contributions (payment_date desc);
create index if not exists expenses_match_idx on public.expenses (match_id);
create index if not exists expenses_date_idx on public.expenses (expense_date desc);
create index if not exists profiles_role_idx on public.profiles (role);

-- Every Auth user receives a profile. Existing users are backfilled below.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Club member'),
    case when exists (select 1 from public.profiles where role = 'admin') then 'player'::public.app_role else 'admin'::public.app_role end,
    new.created_at,
    now()
  )
  on conflict (id) do update set email = excluded.email, display_name = excluded.display_name, updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, display_name, created_at, updated_at)
select
  id,
  email,
  coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), nullif(split_part(coalesce(email, ''), '@', 1), ''), 'Club member'),
  created_at,
  now()
from auth.users
on conflict (id) do update set email = excluded.email, display_name = excluded.display_name, updated_at = now();

-- Bootstrap the oldest existing account as Admin only when no Admin exists.
do $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles
    set role = 'admin', updated_at = now()
    where id = (select id from public.profiles order by created_at asc limit 1);
  end if;
end $$;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profile_updated_at on public.profiles;
create trigger profile_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' and tg_op = 'DELETE'
    and not exists (select 1 from public.profiles where role = 'admin' and id <> old.id) then
    raise exception 'At least one Admin account is required';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if old.role = 'admin' and new.role <> 'admin'
    and not exists (select 1 from public.profiles where role = 'admin' and id <> old.id) then
    raise exception 'At least one Admin account is required';
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_last_admin() from public, anon, authenticated;

drop trigger if exists profiles_keep_admin on public.profiles;
create trigger profiles_keep_admin
before update of role or delete on public.profiles
for each row execute function public.protect_last_admin();

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

revoke execute on function private.current_user_role() from public;
grant execute on function private.current_user_role() to authenticated;

-- A linked member can RSVP only for their own player record and an open match.
create or replace function public.respond_to_match(target_match_id uuid, target_status text)
returns public.attendance
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked_player_id uuid;
  player_default numeric(12, 2);
  response public.attendance;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required';
  end if;
  if target_status not in ('Joined', 'Not Joined', 'Maybe') then
    raise exception 'Invalid attendance status';
  end if;

  select player_id into linked_player_id
  from public.profiles
  where id = (select auth.uid());

  if linked_player_id is null then
    raise exception 'Your account is not linked to a player';
  end if;
  if not exists (
    select 1 from public.matches
    where id = target_match_id
      and match_date >= current_date
      and status in ('Planned', 'Booked')
  ) then
    raise exception 'This match is not open for RSVP';
  end if;

  select default_contribution into player_default
  from public.players
  where id = linked_player_id and is_active = true;

  if player_default is null then
    raise exception 'The linked player is not active';
  end if;

  insert into public.attendance (match_id, player_id, attendance_status, expected_contribution, paid_amount, notes)
  values (target_match_id, linked_player_id, target_status, player_default, 0, 'Player RSVP')
  on conflict (match_id, player_id) do update
    set attendance_status = excluded.attendance_status
  returning * into response;

  return response;
end;
$$;

revoke execute on function public.respond_to_match(uuid, text) from public, anon;
grant execute on function public.respond_to_match(uuid, text) to authenticated;

-- Payment status is always derived; clients never need to calculate it before writes.
create or replace function public.set_payment_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.payment_status := case
    when new.paid_amount <= 0 then 'Due'
    when new.paid_amount < new.expected_contribution then 'Partial'
    when new.paid_amount = new.expected_contribution then 'Paid'
    else 'Extra Paid'
  end;
  return new;
end;
$$;

drop trigger if exists attendance_payment_status on public.attendance;
create trigger attendance_payment_status
before insert or update of paid_amount, expected_contribution on public.attendance
for each row execute function public.set_payment_status();

-- Contributions linked to a match automatically update the matching attendance row.
create or replace function public.sync_attendance_paid_amount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match uuid;
  target_player uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') and old.match_id is not null then
    update public.attendance
    set paid_amount = coalesce((
      select sum(c.amount)
      from public.contributions c
      where c.match_id = old.match_id and c.player_id = old.player_id
    ), 0)
    where match_id = old.match_id and player_id = old.player_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  target_match := new.match_id;
  target_player := new.player_id;
  if target_match is not null then
    update public.attendance
    set paid_amount = coalesce((
      select sum(c.amount)
      from public.contributions c
      where c.match_id = target_match and c.player_id = target_player
    ), 0)
    where match_id = target_match and player_id = target_player;
  end if;
  return new;
end;
$$;

drop trigger if exists contributions_sync_attendance on public.contributions;
create trigger contributions_sync_attendance
after insert or update or delete on public.contributions
for each row execute function public.sync_attendance_paid_amount();

-- Creating a match creates its editable turf-fee expense exactly once.
create or replace function public.add_default_turf_expense()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.expenses (match_id, expense_type, amount, expense_date, notes)
  values (new.id, 'Turf Fee', new.match_cost, new.match_date, 'Auto-added turf fee');
  return new;
end;
$$;

drop trigger if exists match_default_expense on public.matches;
create trigger match_default_expense
after insert on public.matches
for each row execute function public.add_default_turf_expense();

create or replace view public.match_summary_view
with (security_invoker = true)
as
select
  m.id as match_id,
  m.match_date,
  m.turf_name,
  m.status,
  coalesce(a.joined_players, 0) as joined_players,
  coalesce(a.expected_collection, 0) as expected_collection,
  coalesce(c.total_collected, 0) as total_collected,
  greatest(coalesce(a.expected_collection, 0) - coalesce(a.paid_against_attendance, 0), 0) as total_due,
  coalesce(e.total_expense, 0) as total_expense,
  coalesce(c.total_collected, 0) - coalesce(e.total_expense, 0) as match_balance
from public.matches m
left join (
  select match_id,
    count(*) filter (where attendance_status = 'Joined') as joined_players,
    sum(expected_contribution) filter (where attendance_status = 'Joined') as expected_collection,
    sum(paid_amount) filter (where attendance_status = 'Joined') as paid_against_attendance
  from public.attendance group by match_id
) a on a.match_id = m.id
left join (select match_id, sum(amount) as total_collected from public.contributions group by match_id) c on c.match_id = m.id
left join (select match_id, sum(amount) as total_expense from public.expenses group by match_id) e on e.match_id = m.id;

create or replace view public.player_balance_view
with (security_invoker = true)
as
select
  p.id as player_id,
  p.name,
  p.player_type,
  p.is_active,
  coalesce(c.total_paid, 0) as total_paid,
  coalesce(c.extra_contribution, 0) as extra_contribution,
  coalesce(a.total_due, 0) as total_due
from public.players p
left join (
  select player_id, sum(amount) as total_paid,
    sum(amount) filter (where contribution_type = 'Extra Support') as extra_contribution
  from public.contributions group by player_id
) c on c.player_id = p.id
left join (
  select player_id, sum(greatest(expected_contribution - paid_amount, 0)) as total_due
  from public.attendance where attendance_status = 'Joined' group by player_id
) a on a.player_id = p.id;

create or replace view public.overall_balance_view
with (security_invoker = true)
as
select
  coalesce((select sum(amount) from public.contributions), 0) as total_collected,
  coalesce((select sum(amount) from public.expenses), 0) as total_expense,
  coalesce((select sum(amount) from public.contributions), 0) - coalesce((select sum(amount) from public.expenses), 0) as current_balance,
  coalesce((select sum(greatest(expected_contribution - paid_amount, 0)) from public.attendance where attendance_status = 'Joined'), 0) as total_due,
  coalesce((select sum(c.amount) from public.contributions c join public.players p on p.id = c.player_id where p.player_type = 'Boss / Sponsor'), 0) as sponsor_contribution,
  coalesce((select sum(amount) from public.contributions where contribution_type = 'Extra Support'), 0) as extra_contribution;

-- RLS is the source of truth: members read, operational roles write, Admin manages settings and roles.
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.attendance enable row level security;
alter table public.contributions enable row level security;
alter table public.expenses enable row level security;
alter table public.settings enable row level security;

drop policy if exists "Members view own profile" on public.profiles;
drop policy if exists "Admins view all profiles" on public.profiles;
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Members view own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy "Admins view all profiles" on public.profiles for select to authenticated
using ((select private.current_user_role()) = 'admin');
create policy "Admins update profiles" on public.profiles for update to authenticated
using ((select private.current_user_role()) = 'admin')
with check ((select private.current_user_role()) = 'admin');

do $$
declare table_name text;
begin
  foreach table_name in array array['players', 'matches', 'attendance', 'contributions', 'expenses', 'settings'] loop
    execute format('drop policy if exists "Authenticated club access" on public.%I', table_name);
    execute format('drop policy if exists "Club members can view" on public.%I', table_name);
    execute format('drop policy if exists "Club operators can insert" on public.%I', table_name);
    execute format('drop policy if exists "Club operators can update" on public.%I', table_name);
    execute format('drop policy if exists "Club operators can delete" on public.%I', table_name);
    execute format('drop policy if exists "Admins can insert" on public.%I', table_name);
    execute format('drop policy if exists "Admins can update" on public.%I', table_name);
    execute format('drop policy if exists "Admins can delete" on public.%I', table_name);
    execute format('create policy "Club members can view" on public.%I for select to authenticated using (true)', table_name);

    if table_name = 'settings' then
      execute format('create policy "Admins can insert" on public.%I for insert to authenticated with check ((select private.current_user_role()) = ''admin'')', table_name);
      execute format('create policy "Admins can update" on public.%I for update to authenticated using ((select private.current_user_role()) = ''admin'') with check ((select private.current_user_role()) = ''admin'')', table_name);
      execute format('create policy "Admins can delete" on public.%I for delete to authenticated using ((select private.current_user_role()) = ''admin'')', table_name);
    else
      execute format('create policy "Club operators can insert" on public.%I for insert to authenticated with check ((select private.current_user_role()) in (''admin'', ''treasurer''))', table_name);
      execute format('create policy "Club operators can update" on public.%I for update to authenticated using ((select private.current_user_role()) in (''admin'', ''treasurer'')) with check ((select private.current_user_role()) in (''admin'', ''treasurer''))', table_name);
      execute format('create policy "Club operators can delete" on public.%I for delete to authenticated using ((select private.current_user_role()) in (''admin'', ''treasurer''))', table_name);
    end if;
  end loop;
end $$;

revoke all on table public.profiles, public.players, public.matches, public.attendance, public.contributions, public.expenses, public.settings from anon, authenticated;
grant select on table public.profiles, public.players, public.matches, public.attendance, public.contributions, public.expenses, public.settings to authenticated;
grant update on table public.profiles to authenticated;
grant insert, update, delete on table public.players, public.matches, public.attendance, public.contributions, public.expenses to authenticated;
grant insert, update, delete on table public.settings to authenticated;
grant usage on type public.app_role to authenticated;
revoke all on public.match_summary_view, public.player_balance_view, public.overall_balance_view from anon;
grant select on public.match_summary_view, public.player_balance_view, public.overall_balance_view to authenticated;

-- Idempotent sample data: only seed a fresh project.
do $$
declare
  mahadi_id uuid := gen_random_uuid();
  rakib_id uuid := gen_random_uuid();
  hasan_id uuid := gen_random_uuid();
  boss_id uuid := gen_random_uuid();
  guest_id uuid := gen_random_uuid();
  sample_match_id uuid := gen_random_uuid();
  next_saturday date := current_date + (case when extract(dow from current_date)::int = 6 then 7 else (6 - extract(dow from current_date)::int + 7) % 7 end);
begin
  if not exists (select 1 from public.players) then
    insert into public.players (id, name, player_type, default_contribution) values
      (mahadi_id, 'Mahadi', 'Regular', 200),
      (rakib_id, 'Rakib', 'Regular', 200),
      (hasan_id, 'Hasan', 'Regular', 200),
      (boss_id, 'Emranul Hasan', 'Boss / Sponsor', 3000),
      (guest_id, 'Guest Player', 'Guest', 200);

    insert into public.settings (default_match_cost, default_player_contribution, default_turf_name, default_start_time, default_end_time)
    values (1000, 200, 'Green Field Arena', '07:00', '08:00');

    insert into public.matches (id, match_date, start_time, end_time, turf_name, match_cost, status)
    values (sample_match_id, next_saturday, '07:00', '08:00', 'Green Field Arena', 1000, 'Booked');

    insert into public.attendance (match_id, player_id, expected_contribution) values
      (sample_match_id, mahadi_id, 200),
      (sample_match_id, rakib_id, 200),
      (sample_match_id, boss_id, 3000);

    insert into public.contributions (match_id, player_id, amount, contribution_type, payment_method, payment_date) values
      (sample_match_id, mahadi_id, 200, 'Regular Player Fee', 'Cash', current_date),
      (sample_match_id, rakib_id, 200, 'Regular Player Fee', 'bKash', current_date),
      (sample_match_id, boss_id, 3000, 'Extra Support', 'Bank', current_date);
  end if;
end $$;

-- Rename the existing sponsor record when this schema is reapplied.
update public.players
set name = 'Emranul Hasan'
where name = 'Boss' and player_type = 'Boss / Sponsor';
