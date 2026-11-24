begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema salon_private;
revoke all on schema salon_private from public, anon, authenticated;

create table salon_private.settings (
  id boolean primary key default true check (id),
  salon_name text not null default 'The Atelier' check (char_length(salon_name) between 2 and 80),
  opening_time time not null default '10:00',
  closing_time time not null default '21:00',
  online_enabled boolean not null default false,
  version integer not null default 1 check (version > 0),
  check (closing_time > opening_time and closing_time - opening_time >= interval '30 minutes')
);
insert into salon_private.settings default values;

create table salon_private.services (
  id uuid primary key default gen_random_uuid(),
  name_en text not null check (char_length(btrim(name_en)) between 2 and 80 and name_en !~ '[[:cntrl:]]'),
  name_gu text not null check (char_length(btrim(name_gu)) between 2 and 80 and name_gu !~ '[[:cntrl:]]'),
  price_paise integer not null check (price_paise between 0 and 10000000),
  duration_minutes integer not null check (duration_minutes between 1 and 480),
  enabled boolean not null default true,
  version integer not null default 1 check (version > 0)
);
create table salon_private.barbers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z][a-z0-9-]{1,39}$'),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 60 and display_name !~ '[[:cntrl:]]'),
  on_duty boolean not null default false,
  on_break boolean not null default false,
  version integer not null default 1 check (version > 0),
  check (on_duty or not on_break)
);
create table salon_private.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'receptionist', 'barber')),
  barber_id uuid unique references salon_private.barbers(id),
  enabled boolean not null default true,
  check ((role = 'barber') = (barber_id is not null))
);

create sequence salon_private.queue_sequence;
create table salon_private.queue_entries (
  id uuid primary key default gen_random_uuid(),
  sequence bigint not null unique default nextval('salon_private.queue_sequence'),
  token text generated always as ('S-' || sequence::text) stored unique,
  locator text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  capability_hash text not null check (capability_hash ~ '^[0-9a-f]{64}$'),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 60 and customer_name !~ '[[:cntrl:]]'),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  preferred_barber_id uuid references salon_private.barbers(id),
  assigned_barber_id uuid references salon_private.barbers(id),
  source text not null check (source in ('remote', 'walk_in')),
  status text not null default 'waiting' check (status in ('waiting','called','in_chair','done','cancelled','no_show')),
  total_paise integer not null check (total_paise between 0 and 30000000),
  total_minutes integer not null check (total_minutes between 1 and 1440),
  created_at timestamptz not null default clock_timestamp(),
  called_at timestamptz,
  started_at timestamptz,
  terminal_at timestamptz,
  version integer not null default 1 check (version > 0),
  check (preferred_barber_id is null or assigned_barber_id is null or preferred_barber_id = assigned_barber_id),
  check (
    (status = 'waiting' and assigned_barber_id is null and called_at is null and started_at is null and terminal_at is null)
    or (status = 'called' and assigned_barber_id is not null and called_at is not null and started_at is null and terminal_at is null)
    or (status = 'in_chair' and assigned_barber_id is not null and called_at is not null and started_at is not null and terminal_at is null)
    or (status = 'done' and assigned_barber_id is not null and called_at is not null and started_at is not null and terminal_at is not null)
    or (status = 'cancelled' and assigned_barber_id is null and called_at is null and started_at is null and terminal_at is not null)
    or (status = 'no_show' and assigned_barber_id is not null and called_at is not null and started_at is null and terminal_at is not null)
  ),
  check (called_at is null or called_at >= created_at),
  check (started_at is null or started_at >= called_at),
  check (terminal_at is null or terminal_at >= coalesce(started_at, called_at, created_at))
);
create unique index one_active_phone on salon_private.queue_entries(phone)
  where status in ('waiting','called','in_chair');
create unique index one_assignment_per_barber on salon_private.queue_entries(assigned_barber_id)
  where status in ('called','in_chair');
create index waiting_order on salon_private.queue_entries(sequence) where status = 'waiting';
create index completion_day on salon_private.queue_entries(terminal_at) where status in ('done','no_show');

create table salon_private.queue_entry_services (
  entry_id uuid not null references salon_private.queue_entries(id),
  service_id uuid not null references salon_private.services(id),
  name_en text not null,
  name_gu text not null,
  price_paise integer not null check (price_paise between 0 and 10000000),
  duration_minutes integer not null check (duration_minutes between 1 and 480),
  primary key (entry_id, service_id)
);
create table salon_private.operation_receipts (
  scope text not null,
  request_key text not null check (request_key ~ '^[0-9a-f]{32,64}$'),
  fingerprint text not null,
  entry_id uuid references salon_private.queue_entries(id),
  response jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  primary key (scope, request_key)
);
create table salon_private.rate_buckets (
  bucket_hash text not null,
  window_start timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (bucket_hash, window_start)
);

-- This table is deliberately the ONLY public realtime source. No row/customer IDs.
create table public.salonq_changes (
  id boolean primary key default true check (id),
  version bigint not null default 0,
  changed_at timestamptz not null default clock_timestamp()
);
insert into public.salonq_changes default values;
alter table public.salonq_changes enable row level security;
revoke all on public.salonq_changes from anon, authenticated;
grant select on public.salonq_changes to anon, authenticated;
create policy salonq_signal_read on public.salonq_changes for select to anon, authenticated using (true);
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  alter publication supabase_realtime add table public.salonq_changes;
end $$;

-- Deny private table access even if an operator accidentally exposes the schema.
alter table salon_private.settings enable row level security;
alter table salon_private.services enable row level security;
alter table salon_private.barbers enable row level security;
alter table salon_private.staff_profiles enable row level security;
alter table salon_private.queue_entries enable row level security;
alter table salon_private.queue_entry_services enable row level security;
alter table salon_private.operation_receipts enable row level security;
alter table salon_private.rate_buckets enable row level security;
revoke all on all tables in schema salon_private from public, anon, authenticated;
revoke all on all sequences in schema salon_private from public, anon, authenticated;
alter default privileges in schema salon_private revoke execute on functions from public;
alter default privileges in schema salon_private revoke all on tables from public, anon, authenticated;

create function salon_private.now() returns timestamptz language sql volatile
set search_path = '' as $$ select clock_timestamp() $$;
create function salon_private.hash(value text) returns text language sql immutable strict
set search_path = '' as $$ select encode(sha256(convert_to(value, 'UTF8')), 'hex') $$;
create function salon_private.normalize_phone(value text) returns text language plpgsql immutable
set search_path = '' as $$
declare result text;
begin
  result := regexp_replace(btrim(value), '[[:space:]-]', '', 'g');
  if left(result,3) = '+91' then result := substr(result,4); end if;
  if result is null or result !~ '^[6-9][0-9]{9}$' then raise exception 'INVALID_PHONE'; end if;
  return result;
end $$;
create function salon_private.lock_queue() returns void language sql volatile
set search_path = '' as $$ select pg_advisory_xact_lock(7350141) $$;
create function salon_private.signal() returns void language sql volatile
set search_path = '' as $$ update public.salonq_changes set version = version + 1, changed_at = salon_private.now() where id $$;
create function salon_private.staff(actor uuid, allowed text[]) returns salon_private.staff_profiles
language plpgsql stable set search_path = '' as $$
declare profile salon_private.staff_profiles;
begin
  select * into profile from salon_private.staff_profiles where user_id = actor and enabled;
  if not found or not (profile.role = any(allowed)) then raise exception 'FORBIDDEN'; end if;
  return profile;
end $$;

create function salon_private.guard_entry() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'IMMUTABLE_ENTRY'; end if;
  if (new.id,new.sequence,new.customer_name,new.phone,new.capability_hash,new.locator,new.preferred_barber_id,new.source,new.total_paise,new.total_minutes,new.created_at)
     is distinct from
     (old.id,old.sequence,old.customer_name,old.phone,old.capability_hash,old.locator,old.preferred_barber_id,old.source,old.total_paise,old.total_minutes,old.created_at)
     then raise exception 'IMMUTABLE_ENTRY'; end if;
  if not ((old.status = 'waiting' and new.status in ('called','cancelled'))
      or (old.status = 'called' and new.status in ('in_chair','no_show'))
      or (old.status = 'in_chair' and new.status = 'done')) then raise exception 'INVALID_TRANSITION'; end if;
  if new.status = 'no_show' and salon_private.now() < old.called_at + interval '10 minutes' then raise exception 'NO_SHOW_TOO_EARLY'; end if;
  new.version := old.version + 1;
  return new;
end $$;
create trigger guard_entry before update or delete on salon_private.queue_entries
for each row execute function salon_private.guard_entry();
create function salon_private.immutable_snapshot() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'IMMUTABLE_SNAPSHOT'; end $$;
create trigger immutable_snapshot before update or delete on salon_private.queue_entry_services
for each row execute function salon_private.immutable_snapshot();

revoke all on all functions in schema salon_private from public, anon, authenticated;
commit;
