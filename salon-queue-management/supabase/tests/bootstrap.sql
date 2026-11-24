-- TEST HARNESS ONLY. Auth identity is emulated here; never apply this to hosted Supabase.
do $$
begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema auth;
create table auth.users(id uuid primary key);
-- Auth lifecycle is emulated only inside disposable test databases.
create table auth.sessions(id uuid primary key, user_id uuid references auth.users(id), not_after timestamptz);
create function auth.test_session_on_user() returns trigger language plpgsql as $$
begin insert into auth.sessions(id,user_id) values(new.id,new.id); return new; end $$;
create trigger test_session after insert on auth.users for each row execute function auth.test_session_on_user();
create function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('session_id',coalesce(nullif(current_setting('request.jwt.claim.session_id',true),''),nullif(current_setting('request.jwt.claim.sub',true),'')))
$$;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
grant execute on function auth.jwt() to authenticated;
create publication supabase_realtime;
