-- TEST ONLY. Never apply to hosted Supabase. Preserve every production record.
do $$ begin
  if current_database() not like 'salonq_offline_%' or to_regclass('public.test_clock') is null then
    raise exception 'DISPOSABLE_TEST_DATABASE_REQUIRED';
  end if;
end $$;
create function public.qa_reset() returns void language plpgsql as $$ begin
  truncate salon_private.operation_receipts, salon_private.queue_entries cascade;
  update salon_private.settings set opening_time='10:00',closing_time='21:00',online_enabled=true;
  update salon_private.barbers set on_duty=true,on_break=false;
  update salon_private.services set enabled=true,price_paise=15000,duration_minutes=30;
  update public.test_clock set value='2026-11-24T10:00:00+05:30';
  perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',false);
end $$;
create function public.qa_status(receipt jsonb, request jsonb) returns jsonb language sql as $$
  select public.salonq_gateway('status',receipt || jsonb_build_object('capability',request->>'capability'))
$$;
create function public.qa_staff(action text, payload jsonb default '{}'::jsonb, actor text default '30000000-0000-4000-8000-000000000002') returns jsonb language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub',actor,false);
  return public.salonq_staff_command(action,payload || jsonb_build_object('request_key',encode(extensions.gen_random_bytes(32),'hex')));
end $$;
-- Tokens are deliberately never reset, even between test cases.
select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; called jsonb; later jsonb; begin
  req:=public.test_request('9000020001'); receipt:=public.salonq_gateway('admit',req);
  later:=public.salonq_gateway('admit',public.test_request('9000020002'));
  called:=public.qa_staff('call_next',jsonb_build_object('barber_id','20000000-0000-4000-8000-000000000001'));
  update public.test_clock set value='2026-11-24T10:09:59+05:30';
  perform public.test_fails(format('select public.salonq_staff_command(''no_show'',%L::jsonb)',jsonb_build_object('request_key',repeat('a',64),'entry_id',called->>'entry_id','version',2)),'NO_SHOW_TOO_EARLY');
  perform public.test_assert(public.qa_status(receipt,req)->>'status'='called' and exists(select 1 from salon_private.queue_entries where id=(called->>'entry_id')::uuid and assigned_barber_id is not null),'T47 599 seconds leaves Called and capacity occupied');
  update public.test_clock set value='2026-11-24T10:10:00+05:30';
  perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',false);
  perform public.test_fails(format('select public.salonq_staff_command(''no_show'',%L::jsonb)',jsonb_build_object('request_key',repeat('b',64),'entry_id',called->>'entry_id','version',2)),'FORBIDDEN');
  perform public.test_fails('select public.salonq_gateway(''no_show'',''{}'')','INVALID_ACTION');
  perform public.test_assert(public.qa_status(receipt,req)->>'status'='called','T49 wrong-role and customer No-show denied at 600 seconds');
  called:=public.qa_staff('no_show',jsonb_build_object('entry_id',called->>'entry_id','version',2));
  perform public.test_assert(called->>'status'='no_show' and not exists(select 1 from salon_private.queue_entries where assigned_barber_id='20000000-0000-4000-8000-000000000001' and status in ('called','in_chair')),'T19 eligible No-show terminalizes once and releases barber');
  req:=public.test_request('9000020001'); receipt:=public.salonq_gateway('admit',req);
  perform public.test_assert((substring(receipt->>'token' from 3))::bigint>(substring(later->>'token' from 3))::bigint and (public.qa_status(receipt,req)->'estimate'->>'position')::int=2,'T20 returning No-show gets new token at tail');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; first_req jsonb; first_receipt jsonb; called jsonb; started jsonb; begin
  for i in 1..3 loop
    req:=jsonb_set(public.test_request('900002001'||i),'{services}',jsonb_build_array(jsonb_build_object('id','10000000-0000-4000-8000-000000000001','version',(select version from salon_private.services where id='10000000-0000-4000-8000-000000000001'),'price_paise',15000,'duration_minutes',30)));
    receipt:=public.salonq_gateway('admit',req);
    if i=1 then first_req:=req; first_receipt:=receipt; end if;
  end loop;
  req:=jsonb_set(public.test_request('9000020014'),'{services}',jsonb_build_array((req->'services')->0));receipt:=public.salonq_gateway('admit',req);
  perform public.test_assert((public.qa_status(receipt,req)->'estimate'->>'minutes')::int=30 and (public.qa_status(receipt,req)->'estimate'->>'position')::int=4,'T23 ninety minutes ahead with three workers estimates thirty minutes');
  called:=public.qa_staff('call_next',jsonb_build_object('barber_id','20000000-0000-4000-8000-000000000001'));
  started:=public.qa_staff('start',jsonb_build_object('entry_id',called->>'entry_id','version',2),'30000000-0000-4000-8000-000000000003');
  perform public.qa_staff('done',jsonb_build_object('entry_id',called->>'entry_id','version',3),'30000000-0000-4000-8000-000000000003');
  perform public.test_assert((public.qa_status(receipt,req)->'estimate'->>'minutes')::int=20 and (public.qa_status(receipt,req)->'estimate'->>'position')::int=3,'T25 earlier completion recomputes position and lowers estimate');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; previous jsonb; n int; begin
  for source in 1..2 loop
    update public.test_clock set value='2026-11-24T09:59:59+05:30';
    req:=public.test_request('900002002'||source) || jsonb_build_object('source',case when source=1 then 'remote' else 'walk_in' end);
    select count(*) into n from salon_private.queue_entries;
    perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb,''30000000-0000-4000-8000-000000000002'')',req),'SALON_CLOSED');
    perform public.test_assert((select count(*)=n from salon_private.queue_entries),'T42 both sources before opening create no entry');
    update public.test_clock set value='2026-11-24T10:00:00+05:30';
    receipt:=public.salonq_gateway('admit',req,'30000000-0000-4000-8000-000000000002');
    perform public.test_assert((public.qa_status(receipt,req)->>'created_at')::timestamptz='2026-11-24T10:00:00+05:30'::timestamptz and (previous is null or (substring(receipt->>'token' from 3))::bigint>(substring(previous->>'token' from 3))::bigint),'T43 both sources at exact opening retain server time and order');
    previous:=receipt;
    update public.test_clock set value='2026-11-24T21:00:00+05:30';
    perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb,''30000000-0000-4000-8000-000000000002'')',public.test_request('900002003'||source)||jsonb_build_object('source',case when source=1 then 'remote' else 'walk_in' end)),'SALON_CLOSED');
    perform public.test_assert(public.qa_status(receipt,req)->>'status'='waiting','T45 both sources at closing rejected and active access preserved');
  end loop;
  update public.test_clock set value='2026-11-24T20:29:59+05:30';
  req:=public.test_request('9000020041');receipt:=public.salonq_gateway('admit',req);
  update public.test_clock set value='2026-11-24T20:30:00+05:30';
  perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request('9000020042')),'ONLINE_CLOSED');
  perform public.test_assert((public.qa_status(receipt,req)->>'created_at')::timestamptz='2026-11-24T20:29:59+05:30'::timestamptz and public.salonq_gateway('admit',req)=receipt,'T44 acceptance before cutoff survives response observation and replay after cutoff');
  update salon_private.settings set online_enabled=false;
  update public.test_clock set value='2026-11-24T20:59:59+05:30';
  req:=public.test_request('9000020043')||jsonb_build_object('source','walk_in');
  receipt:=public.salonq_gateway('admit',req,'30000000-0000-4000-8000-000000000002');
  perform public.test_assert(public.qa_status(receipt,req)->>'status'='waiting','T46 last-second walk-in ignores manual online pause');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; old jsonb; before_count int; begin
  req:=public.test_request('9000020051');receipt:=public.salonq_gateway('admit',req);old:=public.qa_status(receipt,req);
  update salon_private.services set enabled=false,version=version+1 where id='10000000-0000-4000-8000-000000000001';
  perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',req||jsonb_build_object('request_key',repeat('c',64),'phone','9000020052')),'SERVICE_UNAVAILABLE');
  perform public.test_assert(public.qa_status(receipt,req)->'services'=old->'services','T29 disabling selected service blocks new admission and preserves existing booking');
  perform public.test_assert(public.salonq_gateway('admit',req)=receipt,'T59 original successful receipt survives catalog disable');
  update salon_private.services set enabled=true,version=version+1;
  req:=public.test_request('9000020053');
  update salon_private.services set price_paise=price_paise+1,version=version+1;
  select count(*) into before_count from salon_private.queue_entries;
  perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',req),'CATALOG_CHANGED');
  perform public.test_assert((select count(*)=before_count from salon_private.queue_entries),'T61 stale price creates no entry');
  req:=public.test_request('9000020054');update salon_private.services set duration_minutes=duration_minutes+1,version=version+1;
  perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',req),'CATALOG_CHANGED');
  perform public.test_assert((select count(*)=before_count from salon_private.queue_entries),'T62 stale duration creates no entry');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; called jsonb; begin
  update salon_private.barbers set on_break=true;
  for source in 1..2 loop
    req:=public.test_request('900002006'||source,'20000000-0000-4000-8000-000000000001')||jsonb_build_object('source',case when source=1 then 'remote' else 'walk_in' end);
    receipt:=public.salonq_gateway('admit',req,'30000000-0000-4000-8000-000000000002');
    perform public.test_assert(public.qa_status(receipt,req)->'estimate'->>'state'='unavailable' and (public.qa_status(receipt,req)->'preferred_barber'->>'on_break')::boolean,'T63 both sources admitted while all on break with truthful unavailable warning data');
  end loop;
  perform public.test_fails('select public.salonq_staff_command(''call_next'',jsonb_build_object(''request_key'',repeat(''d'',64),''barber_id'',''20000000-0000-4000-8000-000000000001''))','BARBER_UNAVAILABLE');
  update salon_private.barbers set on_break=false where id='20000000-0000-4000-8000-000000000001';
  called:=public.qa_staff('call_next',jsonb_build_object('barber_id','20000000-0000-4000-8000-000000000001'));
  perform public.test_assert(called->>'status'='called','T64 named break blocks assignment until return');
end $$;

select public.qa_reset();
do $$ declare req jsonb; begin
  update salon_private.barbers set on_duty=false;
  for source in 1..2 loop
    req:=public.test_request('900002007'||source)||jsonb_build_object('source',case when source=1 then 'remote' else 'walk_in' end);
    perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb,''30000000-0000-4000-8000-000000000002'')',req),'NO_BARBERS');
  end loop;
  perform public.test_assert((select count(*)=0 from salon_private.queue_entries) and public.salonq_gateway('public_snapshot')->'estimate'->>'state'='unavailable','T65 no on-duty barber blocks both sources with unavailable estimate');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; called jsonb; estimate jsonb; begin
  for i in 1..3 loop
    req:=public.test_request('900002008'||i);receipt:=public.salonq_gateway('admit',req);
    perform public.qa_staff('call_next',jsonb_build_object('barber_id',case i when 1 then '20000000-0000-4000-8000-000000000001' when 2 then '20000000-0000-4000-8000-000000000002' else '20000000-0000-4000-8000-000000000003' end));
  end loop;
  estimate:=public.salonq_gateway('public_snapshot')->'estimate';
  perform public.test_assert(estimate->>'state'='approximate' and (estimate->>'minutes')::int=60 and (select count(*)=0 from salon_private.queue_entries where status='waiting'),'T67 empty waiting queue includes all occupied workload and never falsely zero');
  called:=(select public.salonq_staff_command('snapshot')->'entries'->0);
  perform public.qa_staff('start',jsonb_build_object('entry_id',called->>'entry_id','version',2),'30000000-0000-4000-8000-000000000003');
  update public.test_clock set value='2026-11-24T11:00:00+05:30';
  perform public.test_assert(public.salonq_gateway('public_snapshot')->'estimate'->>'state'='uncertain' and public.salonq_gateway('public_snapshot')->'estimate'->>'minutes' is null,'T66 exact booked-duration overrun remains uncertain without invented countdown');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; begin
  perform public.salonq_gateway('admit',public.test_request('9000020091','20000000-0000-4000-8000-000000000002'));
  perform public.qa_staff('call_next',jsonb_build_object('barber_id','20000000-0000-4000-8000-000000000002'));
  perform public.salonq_gateway('admit',public.test_request('9000020092'));
  perform public.salonq_gateway('admit',public.test_request('9000020093','20000000-0000-4000-8000-000000000001'));
  req:=public.test_request('9000020094','20000000-0000-4000-8000-000000000001');receipt:=public.salonq_gateway('admit',req);
  perform public.test_assert((public.qa_status(receipt,req)->'estimate'->>'position')::int=3 and (public.qa_status(receipt,req)->'estimate'->>'minutes')::int=120 and public.qa_status(receipt,req)->'estimate'->>'position_kind'='barber','T68 named position and divisor exclude unrelated preferred work');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; later jsonb; before_sequence bigint; begin
  req:=public.test_request('9000020101');receipt:=public.salonq_gateway('admit',req);
  update public.test_clock set value='2026-11-25T09:59:59+05:30';
  perform public.test_assert(public.qa_status(receipt,req)->>'status'='waiting','T75 active entry retains status across closing and midnight');
  update public.test_clock set value='2026-11-25T10:00:00+05:30';
  perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request('9000020101')),'ACTIVE_ENTRY_EXISTS');
  later:=public.salonq_gateway('admit',public.test_request('9000020102'));
  perform public.test_assert((substring(later->>'token' from 3))::bigint>(substring(receipt->>'token' from 3))::bigint and public.qa_staff('call_next',jsonb_build_object('barber_id','20000000-0000-4000-8000-000000000001'))->>'token'=receipt->>'token','T76 new day tokens continue and unresolved previous-day eligible entry stays first');
  update public.test_clock set value='2026-11-27T10:00:00+05:30';
  perform public.test_assert(public.qa_status(receipt,req)->>'status'='called','T79 active capability remains valid across multiple midnights');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; called jsonb; snapshot jsonb; begin
  req:=public.test_request('9000020111');receipt:=public.salonq_gateway('admit',req);
  update public.test_clock set value='2026-11-24T10:10:30+05:30';
  called:=public.qa_staff('call_next',jsonb_build_object('barber_id','20000000-0000-4000-8000-000000000001'));
  perform public.qa_staff('start',jsonb_build_object('entry_id',called->>'entry_id','version',2),'30000000-0000-4000-8000-000000000003');
  update public.test_clock set value='2026-11-25T00:00:00+05:30';
  perform public.qa_staff('done',jsonb_build_object('entry_id',called->>'entry_id','version',3),'30000000-0000-4000-8000-000000000003');
  snapshot:=public.qa_staff('snapshot','{}','30000000-0000-4000-8000-000000000001');
  perform public.test_assert((snapshot->'statistics'->>'served')::int=1 and (snapshot->'statistics'->>'average_wait_minutes')::numeric=10.5,'T77 previous-day join completed today uses IST completion date and exact mean wait');
  update public.test_clock set value='2026-11-25T23:59:59.999+05:30';
  perform public.test_assert(public.qa_status(receipt,req)->>'status'='done','T78 terminal link valid just before twenty-four hours');
  update public.test_clock set value='2026-11-26T00:00:00+05:30';
  perform public.test_fails(format('select public.qa_status(%L::jsonb,%L::jsonb)',receipt,req),'STATUS_UNAVAILABLE');
  perform public.test_assert((select count(*)=1 from salon_private.queue_entries where status='done'),'T78 exact expiry denies access without deleting history');
  update public.test_clock set value='2026-11-25T01:00:00+05:30';
  perform public.test_assert(public.qa_staff('snapshot','{}','30000000-0000-4000-8000-000000000001')->'statistics'=snapshot->'statistics','T78 access expiry does not alter retained owner statistics');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; original jsonb; invalid jsonb; begin
  req:=public.test_request('9000020121');receipt:=public.salonq_gateway('admit',req);
  original:=req;
  for invalid in select value from jsonb_array_elements(jsonb_build_array(
    req||jsonb_build_object('phone','9000020122'),req||jsonb_build_object('preferred_barber_id','20000000-0000-4000-8000-000000000001'),
    req||jsonb_build_object('source','walk_in'),req||jsonb_build_object('capability',repeat('0',64)),jsonb_set(req,'{services}',jsonb_build_array(req->'services'->0)))) loop
    perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb,''30000000-0000-4000-8000-000000000002'')',invalid),'IDEMPOTENCY_CONFLICT');
  end loop;
  perform public.test_assert((select count(*)=1 from salon_private.queue_entries),'T57 every changed bound field conflicts without a second admission');
end $$;

select public.qa_reset();
do $$ declare req jsonb; receipt jsonb; invalid text; original jsonb; begin
  req:=public.test_request('9000020131');receipt:=public.salonq_gateway('admit',req);
  foreach invalid in array array['+91 90000-20131','90000 20131','90000-20131'] loop
    perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request(invalid)),'ACTIVE_ENTRY_EXISTS');
  end loop;
  perform public.test_assert((select count(*)=1 from salon_private.queue_entries),'T73 normalized phone variants share one active entry');
  foreach invalid in array array['+44 9000020131','90000abc31','09000020131','919000020131','900002013','90000201311'] loop
    perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request(invalid)),'INVALID_PHONE');
  end loop;
  perform public.test_assert((select count(*)=1 from salon_private.queue_entries),'T74 malformed phones rejected without entries');
  foreach invalid in array array['',repeat('f',64)] loop
    perform public.test_fails(format('select public.salonq_gateway(''status'',%L::jsonb)',receipt||jsonb_build_object('capability',invalid)),'STATUS_UNAVAILABLE');
    perform public.test_fails(format('select public.salonq_gateway(''cancel'',%L::jsonb)',receipt||jsonb_build_object('capability',invalid)),'STATUS_UNAVAILABLE');
  end loop;
  perform public.test_fails('select public.salonq_gateway(''status'',''{"phone":"9000020131","token":"S-1"}''::jsonb)','STATUS_UNAVAILABLE');
  perform public.test_assert(public.qa_status(receipt,req)->>'status'='waiting','T80 token phone and wrong capabilities cannot read or cancel');
  update salon_private.settings set online_enabled=false;
  perform public.test_assert(not (public.salonq_gateway('public_snapshot')->'admission'->>'online')::boolean and public.salonq_gateway('public_snapshot')->'admission'->>'reason'='ONLINE_PAUSED','T28 manual pause appears in truthful public admission projection');
  perform public.test_fails(format('select public.salonq_gateway(''admit'',%L::jsonb)',public.test_request('9000020132')),'ONLINE_CLOSED');
  perform public.salonq_gateway('admit',public.test_request('9000020133')||jsonb_build_object('source','walk_in'),'30000000-0000-4000-8000-000000000002');
  perform public.test_assert((select count(*)=2 from salon_private.queue_entries),'T28 online pause rejects remote and preserves existing and walk-in entries');
end $$;

select public.qa_reset();
do $$ declare base jsonb; patch jsonb; result jsonb; sid uuid:='10000000-0000-4000-8000-000000000001'; begin
  base:=jsonb_build_object('id',sid,'version',(select version from salon_private.services where id=sid),'name_en','QA Service','name_gu','કસોટી સેવા','price_paise',0,'duration_minutes',1,'enabled',true);
  perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',false);
  for patch in select value from jsonb_array_elements('[{"name_gu":""},{"name_en":"X"},{"duration_minutes":0},{"duration_minutes":481},{"price_paise":-1},{"price_paise":10000001}]'::jsonb) loop
    perform public.test_fails(format('select public.salonq_staff_command(''save_service'',%L::jsonb)',base||patch||jsonb_build_object('request_key',encode(extensions.gen_random_bytes(32),'hex'))),'23514');
  end loop;
  perform public.test_fails(format('select public.salonq_staff_command(''save_service'',%L::jsonb)',base||'{"duration_minutes":1.5}'::jsonb||jsonb_build_object('request_key',repeat('f',64))),'22P02');
  result:=public.qa_staff('save_service',base,'30000000-0000-4000-8000-000000000001');
  perform public.test_assert((result->>'price_paise')::int=0 and (result->>'duration_minutes')::int=1,'T90 exact catalog bounds reject invalid fields and accept zero price');
  perform public.test_fails(format('select public.salonq_staff_command(''save_service'',%L::jsonb)',base||jsonb_build_object('request_key',repeat('e',64))),'STALE_VERSION');
  perform public.test_assert((select version=(result->>'version')::int from salon_private.services where id=sid),'T87 stale service save leaves the first owner edit intact');
end $$;

set role authenticated;
select public.test_fails('update salon_private.queue_entries set status=''done''','42501');
select public.test_fails('update salon_private.queue_entries set total_paise=0,total_minutes=1','42501');
select public.test_fails('update salon_private.queue_entries set created_at=clock_timestamp(),sequence=1','42501');
select public.test_fails('update salon_private.queue_entry_services set name_en=''Tampered'',price_paise=0','42501');
select public.test_assert(true,'T82 direct status totals snapshots tokens and timestamp edits denied');
reset role;

select public.qa_reset();
do $$ declare settings jsonb; service jsonb; saved jsonb; second_owner text:='30000000-0000-4000-8000-000000000004'; begin
  insert into salon_private.staff_profiles(user_id,role) values(second_owner::uuid,'owner');
  select to_jsonb(s) into settings from salon_private.settings s;
  select to_jsonb(s) into service from salon_private.services s order by id limit 1;
  saved:=public.qa_staff('save_settings',settings||'{"salon_name":"First owner change"}'::jsonb,'30000000-0000-4000-8000-000000000001');
  perform set_config('request.jwt.claim.sub',second_owner,false);
  perform public.test_fails(format('select public.salonq_staff_command(''save_settings'',%L::jsonb)',settings||jsonb_build_object('request_key',repeat('a',64),'salon_name','Second owner stale change')),'STALE_VERSION');
  perform public.test_assert(public.qa_staff('snapshot','{}',second_owner)->'settings'=saved,'T87 two distinct owners cannot overwrite stale settings');
  saved:=public.qa_staff('save_service',service||'{"name_en":"First owner service"}'::jsonb,'30000000-0000-4000-8000-000000000001');
  perform set_config('request.jwt.claim.sub',second_owner,false);
  perform public.test_fails(format('select public.salonq_staff_command(''save_service'',%L::jsonb)',service||jsonb_build_object('request_key',repeat('b',64),'name_en','Second owner service')),'STALE_VERSION');
  perform public.test_assert((select to_jsonb(s)=saved from salon_private.services s where id=(service->>'id')::uuid),'T87 two distinct owners cannot overwrite stale catalog edit');
end $$;
