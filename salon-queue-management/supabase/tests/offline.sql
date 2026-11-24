-- TEST ONLY: never run this file on a hosted project. All identities are fictional.
create table public.test_clock(value timestamptz not null);
insert into public.test_clock values ('2026-11-24T10:00:00+05:30');
create or replace function salon_private.now() returns timestamptz language sql volatile set search_path='' as $$ select value from public.test_clock $$;
create function public.test_assert(condition boolean, label text) returns void language plpgsql as $$
begin if condition is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if; raise warning 'PASS %',label; end $$;
create function public.test_fails(statement text, expected text) returns void language plpgsql as $$
begin
  begin execute statement; exception when others then
    if sqlerrm = expected or sqlstate = expected then raise warning 'PASS expected %',expected; return; end if;
    raise exception 'Expected %, got % (%)',expected,sqlerrm,sqlstate;
  end;
  raise exception 'Expected failure % but statement succeeded',expected;
end $$;
insert into auth.users values ('30000000-0000-4000-8000-000000000001'),('30000000-0000-4000-8000-000000000002'),('30000000-0000-4000-8000-000000000003'),('30000000-0000-4000-8000-000000000004');
insert into salon_private.staff_profiles(user_id,role,barber_id) values
 ('30000000-0000-4000-8000-000000000001','owner',null),
 ('30000000-0000-4000-8000-000000000002','receptionist',null),
 ('30000000-0000-4000-8000-000000000003','barber','20000000-0000-4000-8000-000000000001');
update salon_private.barbers set on_duty=true;
update salon_private.settings set online_enabled=true;
create function public.test_request(phone_value text, preferred uuid default null) returns jsonb language sql as $$
select jsonb_build_object('name','Fictional Test Customer','phone',phone_value,'preferred_barber_id',preferred,'source','remote',
 'request_key',encode(extensions.gen_random_bytes(32),'hex'),'capability',encode(extensions.gen_random_bytes(32),'hex'),
 'services',(select jsonb_agg(jsonb_build_object('id',id,'version',version,'price_paise',price_paise,'duration_minutes',duration_minutes) order by id)
 from salon_private.services where id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002')))
$$;
create table public.test_data(name text primary key, request jsonb, receipt jsonb);
insert into public.test_data(name,request) values('first',public.test_request('9876500001')),('named',public.test_request('9876500002','20000000-0000-4000-8000-000000000001')),('any',public.test_request('9876500003'));
update public.test_data set receipt=public.salonq_gateway('admit',request) where name='first';
select public.test_assert((select count(*)=8 and bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='salon_private' and c.relkind='r'),'RLS on all private tables');
select public.test_assert((select (public.salonq_gateway('status',receipt || jsonb_build_object('capability',request->>'capability'))->>'total_paise')::integer=23000 from public.test_data where name='first'),'authoritative two-service price');
select public.test_assert((select (public.salonq_gateway('status',receipt || jsonb_build_object('capability',request->>'capability'))->>'total_minutes')::integer=45 from public.test_data where name='first'),'two-service duration snapshot');
select public.test_assert((select public.salonq_gateway('admit',request)=receipt from public.test_data where name='first'),'same admission request replays original receipt');
select public.test_assert((select count(*)=1 from salon_private.queue_entries),'one entry after retry');
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',request || jsonb_build_object('name','Changed Name')),'IDEMPOTENCY_CONFLICT') from public.test_data where name='first';
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request('+91 98765-00001')),'ACTIVE_ENTRY_EXISTS');
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request('12345')),'INVALID_PHONE');
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request('9876500004') || jsonb_build_object('services','[]'::jsonb)),'INVALID_SERVICES');
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',jsonb_set(public.test_request('9876500004'),'{services,0,price_paise}','1')),'CATALOG_CHANGED');
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',jsonb_set(public.test_request('9876500004'),'{services,0,duration_minutes}','1')),'CATALOG_CHANGED');
select public.test_fails(format('select public.salonq_gateway(''status'',%L::jsonb)',receipt || jsonb_build_object('capability',repeat('f',64))),'STATUS_UNAVAILABLE') from public.test_data where name='first';
select public.test_assert(public.salonq_gateway('public_snapshot')::text not like '%Fictional Test Customer%' and public.salonq_gateway('public_snapshot')::text not like '%capability%' and public.salonq_gateway('public_snapshot')::text not like '%9876500001%','public snapshot excludes customer PII');
set role anon;
select public.test_fails('select * from salon_private.queue_entries','42501');
select public.test_fails('select public.salonq_gateway(''public_snapshot'')','42501');
select public.test_assert((select count(*)=1 from public.salonq_changes),'anonymous sanitized signal read');
select public.test_fails('update public.salonq_changes set version=999','42501');
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000004',false);
select public.test_fails('select public.salonq_staff_profile()','FORBIDDEN');
select public.test_fails('update salon_private.staff_profiles set role=''owner''','42501');
reset role;
update public.test_data set receipt=public.salonq_gateway('admit',request) where name in ('named','any');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',false);
create table public.test_results(name text primary key, result jsonb);
insert into public.test_results values('amit',public.salonq_staff_command('call_next',jsonb_build_object('request_key',repeat('a',64),'barber_id','20000000-0000-4000-8000-000000000002')));
insert into public.test_results values('ravi',public.salonq_staff_command('call_next',jsonb_build_object('request_key',repeat('b',64),'barber_id','20000000-0000-4000-8000-000000000001')));
select public.test_assert((select result->>'token'=(select receipt->>'token' from public.test_data where name='first') from public.test_results where name='amit'),'Amit selects earliest Any and respects Ravi preference');
select public.test_assert((select result->>'token'=(select receipt->>'token' from public.test_data where name='named') from public.test_results where name='ravi'),'Ravi selects earliest eligible named customer');
select public.test_fails(format('select public.salonq_staff_command(''call_next'',%L::jsonb)',jsonb_build_object('request_key',repeat('c',64),'barber_id','20000000-0000-4000-8000-000000000001')),'BARBER_BUSY');
select public.test_fails(format('select public.salonq_gateway(''cancel'',%L::jsonb)',receipt || jsonb_build_object('capability',request->>'capability')),'INVALID_TRANSITION') from public.test_data where name='first';
select public.test_fails(format('select public.salonq_staff_command(''start'',%L::jsonb)',jsonb_build_object('request_key',repeat('d',64),'entry_id',result->>'entry_id','version',2)),'FORBIDDEN') from public.test_results where name='ravi';
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',false);
select public.test_fails(format('select public.salonq_staff_command(''start'',%L::jsonb)',jsonb_build_object('request_key',repeat('d',64),'entry_id',result->>'entry_id','version',2)),'FORBIDDEN') from public.test_results where name='amit';
insert into public.test_results select 'started',public.salonq_staff_command('start',jsonb_build_object('request_key',repeat('e',64),'entry_id',result->>'entry_id','version',2)) from public.test_results where name='ravi';
select public.test_assert((select result->>'status'='in_chair' from public.test_results where name='started'),'assigned barber Start persists');
update public.test_clock set value='2026-11-24T10:45:00+05:30';
select public.test_assert((select salon_private.estimate(e.sequence,'20000000-0000-4000-8000-000000000001')->>'state'='uncertain' from salon_private.queue_entries e where e.locator=(select receipt->>'locator' from public.test_data where name='any')),'overrun is uncertain without rolling five-minute promise');
insert into public.test_results select 'done',public.salonq_staff_command('done',jsonb_build_object('request_key',repeat('f',64),'entry_id',result->>'entry_id','version',3)) from public.test_results where name='ravi';
select public.test_assert((select result->>'status'='done' from public.test_results where name='done'),'assigned barber Done persists');
select public.test_fails(format('select public.salonq_staff_command(''start'',%L::jsonb)',jsonb_build_object('request_key',repeat('1',64),'entry_id',result->>'entry_id','version',4)),'INVALID_TRANSITION') from public.test_results where name='ravi';
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',false);
update public.test_clock set value='2026-11-24T10:09:59+05:30';
select public.test_fails(format('select public.salonq_staff_command(''no_show'',%L::jsonb)',jsonb_build_object('request_key',repeat('2',64),'entry_id',result->>'entry_id','version',2)),'NO_SHOW_TOO_EARLY') from public.test_results where name='amit';
update public.test_clock set value='2026-11-24T10:10:00+05:30';
insert into public.test_results select 'no_show',public.salonq_staff_command('no_show',jsonb_build_object('request_key',repeat('2',64),'entry_id',result->>'entry_id','version',2)) from public.test_results where name='amit';
select public.test_assert((select result->>'status'='no_show' from public.test_results where name='no_show'),'No-show allowed exactly at 600 seconds');
insert into public.test_data(name,request) values('return',public.test_request('9876500001'));
update public.test_data set receipt=public.salonq_gateway('admit',request) where name='return';
select public.test_assert((select (substring(receipt->>'token' from 3))::bigint>(select (substring(receipt->>'token' from 3))::bigint from public.test_data where name='any') from public.test_data where name='return'),'returning No-show receives a new tail token');
select public.test_assert((public.salonq_gateway('cancel',receipt || jsonb_build_object('capability',request->>'capability'))->>'status')='cancelled','Waiting cancellation') from public.test_data where name='any';
update public.test_clock set value='2026-11-25T10:10:00+05:30';
select public.test_fails(format('select public.salonq_gateway(''status'',%L::jsonb)',receipt || jsonb_build_object('capability',request->>'capability')),'STATUS_UNAVAILABLE') from public.test_data where name='first';
select public.test_assert((public.salonq_gateway('status',receipt || jsonb_build_object('capability',request->>'capability'))->>'status')='waiting','active access survives midnight and 24 hours') from public.test_data where name='return';
update public.test_clock set value='2026-11-25T09:59:59+05:30';
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request('9876500004')),'SALON_CLOSED');
update public.test_clock set value='2026-11-25T10:00:00+05:30';
select public.test_assert(public.salonq_gateway('admit',public.test_request('9876500004'))->>'token' is not null,'admission at exact opening');
update public.test_clock set value='2026-11-25T20:29:59+05:30';
select public.test_assert(public.salonq_gateway('admit',public.test_request('9876500005'))->>'token' is not null,'online admission just before cutoff');
update public.test_clock set value='2026-11-25T20:30:00+05:30';
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request('9876500006')),'ONLINE_CLOSED');
select public.test_assert(public.salonq_staff_command('admit',public.test_request('9876500006') || jsonb_build_object('source','walk_in'))->>'token' is not null,'walk-in at online cutoff');
update public.test_clock set value='2026-11-25T21:00:00+05:30';
select public.test_fails(format('select public.salonq_staff_command(''admit'',%L::jsonb)',public.test_request('9876500007') || jsonb_build_object('source','walk_in')),'SALON_CLOSED');
update public.test_clock set value='2026-11-25T10:00:00+05:30';
update salon_private.barbers set on_break=true;
select public.test_assert(public.salonq_gateway('admit',public.test_request('9876500007'))->>'token' is not null,'all on-duty barbers on break still allows admission');
select public.test_assert(salon_private.estimate(9223372036854775807)->>'state'='unavailable','zero working barbers means unavailable not zero');
update salon_private.barbers set on_break=false;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
select public.test_assert((public.salonq_staff_command('snapshot')->'statistics'->>'served')::integer=0,'IST stats exclude yesterday completions');
select public.test_assert(public.salonq_gateway('admit',public.test_request('9876500008','20000000-0000-4000-8000-000000000001'))->>'token' is not null,'new preferred Waiting customer admitted');
select public.test_fails(format('select public.salonq_staff_command(''set_duty'',%L::jsonb)',jsonb_build_object('request_key',repeat('3',64),'barber_id','20000000-0000-4000-8000-000000000001','version',1,'on_duty',false,'on_break',false)),'BARBER_HAS_WAITING');
select public.test_assert(public.salonq_rate_limit(repeat('a',64),1),'first rate bucket request allowed');
select public.test_assert(not public.salonq_rate_limit(repeat('a',64),1),'excess rate bucket request denied');
select public.test_assert((select count(*)=1 and bool_and(schemaname='public' and tablename='salonq_changes') from pg_publication_tables where pubname='supabase_realtime'),'only sanitized signal is published');
select public.test_assert((select public.salonq_gateway('receipt',jsonb_build_object('request_key',request->>'request_key','capability',request->>'capability'))=receipt from public.test_data where name='return'),'lost-response receipt recovered using matching capability');
select public.test_fails(format('select public.salonq_gateway(''receipt'',%L::jsonb)',jsonb_build_object('request_key',request->>'request_key','capability',repeat('f',64))),'STATUS_UNAVAILABLE') from public.test_data where name='return';
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',false);
select public.test_assert(public.salonq_staff_command('call_next',jsonb_build_object('request_key',repeat('b',64),'barber_id','20000000-0000-4000-8000-000000000001'))=(select result from public.test_results where name='ravi'),'Call Next retry after completion does not call another customer');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
select public.test_assert((public.salonq_staff_command('set_duty',jsonb_build_object('request_key',repeat('4',64),'barber_id','20000000-0000-4000-8000-000000000003','version',1,'on_duty',true,'on_break',true))->>'on_break')::boolean,'owner can put idle barber on break');
select public.test_assert(not (public.salonq_staff_command('set_duty',jsonb_build_object('request_key',repeat('5',64),'barber_id','20000000-0000-4000-8000-000000000003','version',2,'on_duty',true,'on_break',false))->>'on_break')::boolean,'owner can return idle barber from break');
select public.test_assert((public.salonq_staff_command('save_service',jsonb_build_object('request_key',repeat('6',64),'id','10000000-0000-4000-8000-000000000001','version',1,'name_en','Updated haircut','name_gu','બદલાયેલ હેરકટ','price_paise',25000,'duration_minutes',40,'enabled',true))->>'version')::integer=2,'owner catalog edit increments version');
select public.test_assert((select (public.salonq_gateway('status',receipt || jsonb_build_object('capability',request->>'capability'))->>'total_paise')::integer=23000 from public.test_data where name='return'),'old entry retains catalog price and duration snapshots');
select public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',(select request from public.test_data where name='return') || jsonb_build_object('phone','9876500009','request_key',repeat('7',64))),'CATALOG_CHANGED');
select public.test_assert((public.salonq_staff_command('save_settings',jsonb_build_object('request_key',repeat('8',64),'version',1,'salon_name','The Atelier','opening_time','10:00','closing_time','21:00','online_enabled',false))->>'version')::integer=2,'owner settings save increments version');
select public.test_fails(format('select public.salonq_staff_command(''save_settings'',%L::jsonb)',jsonb_build_object('request_key',repeat('9',64),'version',1,'salon_name','The Atelier','opening_time','10:00','closing_time','21:00','online_enabled',true)),'STALE_VERSION');
select public.test_assert(public.salonq_staff_command('admit',public.test_request('9876500009') || jsonb_build_object('source','walk_in'))->>'token' is not null,'walk-in bypasses manual online pause');
set role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',false);
select public.test_fails('select public.salonq_staff_command(''save_settings'',jsonb_build_object(''request_key'',repeat(''a'',64)))','FORBIDDEN');
select public.test_assert((public.salonq_staff_command('snapshot')->'next'->>'token') is not null,'linked barber receives minimal next preview');
reset role;
select public.test_assert(not (public.salonq_gateway('public_snapshot')::text like '%locator%'),'public tokens do not expose status locators');
select public.test_assert((select count(*)=3 and bool_and(barber->'estimate' is not null) from jsonb_array_elements(public.salonq_gateway('public_snapshot')->'barbers') barber),'public barber estimates use the existing authoritative estimator');
-- A retry receipt must never restore permissions removed after the original action.
update salon_private.staff_profiles set role='barber',barber_id='20000000-0000-4000-8000-000000000003' where user_id='30000000-0000-4000-8000-000000000002';
set role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',false);
select public.test_fails('select public.salonq_staff_command(''call_next'',jsonb_build_object(''request_key'',repeat(''b'',64),''barber_id'',''20000000-0000-4000-8000-000000000001''))','FORBIDDEN');
reset role;
update salon_private.staff_profiles set role='receptionist',barber_id=null where user_id='30000000-0000-4000-8000-000000000002';
update salon_private.staff_profiles set role='receptionist' where user_id='30000000-0000-4000-8000-000000000001';
set role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
select public.test_fails('select public.salonq_staff_command(''set_duty'',jsonb_build_object(''request_key'',repeat(''4'',64),''barber_id'',''20000000-0000-4000-8000-000000000003'',''version'',1,''on_duty'',true,''on_break'',true))','FORBIDDEN');
reset role;
update salon_private.staff_profiles set role='owner' where user_id='30000000-0000-4000-8000-000000000001';
update salon_private.staff_profiles set barber_id='20000000-0000-4000-8000-000000000002' where user_id='30000000-0000-4000-8000-000000000003';
set role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',false);
-- Read the saved result under test-admin role before checking its role-restricted replay.
reset role;
select public.test_fails(format('select public.salonq_staff_command(''start'',%L::jsonb)',jsonb_build_object('request_key',repeat('e',64),'entry_id',result->>'entry_id','version',2)),'FORBIDDEN') from public.test_results where name='ravi';
update salon_private.staff_profiles set barber_id='20000000-0000-4000-8000-000000000001' where user_id='30000000-0000-4000-8000-000000000003';
