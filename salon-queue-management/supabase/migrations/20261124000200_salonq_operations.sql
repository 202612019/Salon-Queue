begin;

create function salon_private.estimate(before_sequence bigint, preferred uuid default null) returns jsonb
language plpgsql stable set search_path = '' as $$
declare workers integer; workload numeric; ahead integer; overrun boolean; ready boolean; clock_value timestamptz := salon_private.now();
begin
  select count(*) into ahead from salon_private.queue_entries
    where status = 'waiting' and sequence < before_sequence
      and (preferred is null or preferred_barber_id is null or preferred_barber_id = preferred);
  select count(*) into workers from salon_private.barbers where on_duty and not on_break and (preferred is null or id = preferred);
  if workers = 0 then
    return jsonb_build_object('state','unavailable','minutes',null,'position',ahead+1,'position_kind',case when preferred is null then 'global' else 'barber' end);
  end if;
  select exists (
    select 1 from salon_private.barbers b where b.on_duty and not b.on_break and (preferred is null or b.id = preferred)
      and not exists (select 1 from salon_private.queue_entries e where e.assigned_barber_id = b.id and e.status in ('called','in_chair'))
      and not exists (select 1 from salon_private.queue_entries e where e.status = 'waiting' and e.sequence < before_sequence and (e.preferred_barber_id is null or e.preferred_barber_id = b.id))
  ) into ready;
  select coalesce(sum(e.total_minutes),0) into workload from salon_private.queue_entries e where e.status = 'waiting'
    and e.sequence < before_sequence and (preferred is null or e.preferred_barber_id is null or e.preferred_barber_id = preferred);
  select workload + coalesce(sum(case when e.status = 'called' then e.total_minutes
    else greatest(0, e.total_minutes - extract(epoch from (clock_value-e.started_at))/60) end),0),
    coalesce(bool_or(e.status = 'in_chair' and clock_value >= e.started_at + e.total_minutes * interval '1 minute'),false)
    into workload, overrun
    from salon_private.queue_entries e join salon_private.barbers b on b.id = e.assigned_barber_id
    where e.status in ('called','in_chair') and b.on_duty and not b.on_break and (preferred is null or b.id = preferred);
  return jsonb_build_object(
    'state',case when ready then 'ready' when overrun or workload = 0 then 'uncertain' else 'approximate' end,
    'minutes',case when ready then 0 when overrun or workload = 0 then null else ceil(workload/workers)::integer end,
    'position',ahead+1,'position_kind',case when preferred is null then 'global' else 'barber' end
  );
end $$;

create function salon_private.entry_payload(entry_uuid uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'token',e.token,'customer_name',e.customer_name,'status',e.status,'source',e.source,'version',e.version,
    'created_at',e.created_at,'called_at',e.called_at,'started_at',e.started_at,'terminal_at',e.terminal_at,
    'total_paise',e.total_paise,'total_minutes',e.total_minutes,
    'preferred_barber',case when p.id is null then null else jsonb_build_object('id',p.id,'name',p.display_name,'on_break',p.on_break,'on_duty',p.on_duty) end,
    'assigned_barber',case when b.id is null then null else jsonb_build_object('id',b.id,'name',b.display_name) end,
    'services',coalesce((select jsonb_agg(jsonb_build_object('id',s.service_id,'name_en',s.name_en,'name_gu',s.name_gu,'price_paise',s.price_paise,'duration_minutes',s.duration_minutes) order by s.service_id)
      from salon_private.queue_entry_services s where s.entry_id = e.id),'[]'::jsonb),
    'estimate',case when e.status = 'waiting' then salon_private.estimate(e.sequence,e.preferred_barber_id) else null end
  ) from salon_private.queue_entries e
    left join salon_private.barbers p on p.id = e.preferred_barber_id
    left join salon_private.barbers b on b.id = e.assigned_barber_id where e.id = entry_uuid
$$;

create function salon_private.public_snapshot() returns jsonb language plpgsql stable set search_path = '' as $$
declare config salon_private.settings; clock_value timestamptz := salon_private.now(); local_clock time; roster boolean; catalog boolean;
begin
  select * into config from salon_private.settings where id;
  local_clock := (clock_value at time zone 'Asia/Kolkata')::time;
  select exists(select 1 from salon_private.barbers where on_duty) into roster;
  select exists(select 1 from salon_private.services where enabled) into catalog;
  return jsonb_build_object(
    'server_time',clock_value,'salon_name',config.salon_name,'timezone','Asia/Kolkata',
    'opening_time',config.opening_time,'closing_time',config.closing_time,'online_enabled',config.online_enabled,
    'admission',jsonb_build_object('online',local_clock >= config.opening_time and local_clock < config.closing_time - interval '30 minutes' and config.online_enabled and roster and catalog,
      'walk_in',local_clock >= config.opening_time and local_clock < config.closing_time and roster and catalog,
      'reason',case when local_clock < config.opening_time then 'BEFORE_OPENING' when local_clock >= config.closing_time then 'SALON_CLOSED'
        when not roster then 'NO_BARBERS' when not catalog then 'NO_SERVICES' when not config.online_enabled then 'ONLINE_PAUSED'
        when local_clock >= config.closing_time - interval '30 minutes' then 'ONLINE_CUTOFF' else 'OPEN' end),
    'waiting_count',(select count(*) from salon_private.queue_entries where status='waiting'),
    'estimate',salon_private.estimate(9223372036854775807),
    'services',coalesce((select jsonb_agg(to_jsonb(s) order by s.name_en) from salon_private.services s where enabled),'[]'::jsonb),
    'barbers',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'slug',b.slug,'display_name',b.display_name,'on_duty',b.on_duty,'on_break',b.on_break,
      'token',e.token,'status',e.status,'called_at',e.called_at) order by b.slug)
      from salon_private.barbers b left join salon_private.queue_entries e on e.assigned_barber_id=b.id and e.status in ('called','in_chair')),'[]'::jsonb),
    'next_tokens',coalesce((select jsonb_agg(jsonb_build_object('token',q.token,'estimate',salon_private.estimate(q.sequence,q.preferred_barber_id)) order by q.sequence)
      from (select token,sequence,preferred_barber_id from salon_private.queue_entries where status='waiting' order by sequence limit 5) q),'[]'::jsonb)
  );
end $$;

create function salon_private.customer_entry(locator_value text, capability text) returns salon_private.queue_entries
language plpgsql stable set search_path = '' as $$
declare entry salon_private.queue_entries;
begin
  if capability is null or capability !~ '^[0-9a-f]{64}$' or locator_value is null or locator_value !~ '^[0-9a-f]{32}$' then raise exception 'STATUS_UNAVAILABLE'; end if;
  select * into entry from salon_private.queue_entries where locator = locator_value and capability_hash = salon_private.hash(capability);
  if not found or (entry.terminal_at is not null and salon_private.now() >= entry.terminal_at + interval '24 hours') then raise exception 'STATUS_UNAVAILABLE'; end if;
  return entry;
end $$;

create function salon_private.admit(payload jsonb, actor uuid default null) returns jsonb language plpgsql set search_path = '' as $$
declare config salon_private.settings; selection record; service salon_private.services; row_data salon_private.queue_entries;
  receipt salon_private.operation_receipts; items jsonb; canonical_items jsonb; fingerprint_value text;
  normalized text; name_value text; request_value text; cap text; source_value text; preferred uuid;
  price_total integer := 0; minute_total integer := 0; decision_time timestamptz; local_clock time;
begin
  perform salon_private.lock_queue();
  request_value := payload->>'request_key'; cap := payload->>'capability';
  source_value := coalesce(payload->>'source','remote');
  if source_value not in ('remote','walk_in') then raise exception 'INVALID_INPUT'; end if;
  if source_value = 'walk_in' then perform salon_private.staff(actor,array['owner','receptionist']); else actor := null; end if;
  if request_value is null or request_value !~ '^[0-9a-f]{32,64}$' or cap is null or cap !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_INPUT'; end if;
  name_value := btrim(payload->>'name'); normalized := salon_private.normalize_phone(payload->>'phone');
  preferred := nullif(payload->>'preferred_barber_id','')::uuid;
  if name_value is null or char_length(name_value) not between 2 and 60 or name_value ~ '[[:cntrl:]]' then raise exception 'INVALID_NAME'; end if;
  items := payload->'services';
  if jsonb_typeof(items) is distinct from 'array' then raise exception 'INVALID_SERVICES'; end if;
  if jsonb_array_length(items) not between 1 and 3 then raise exception 'INVALID_SERVICES'; end if;
  if (select count(distinct x->>'id') from jsonb_array_elements(items) x) <> jsonb_array_length(items) then raise exception 'INVALID_SERVICES'; end if;
  select jsonb_agg(jsonb_build_object('id',(x->>'id')::uuid,'version',(x->>'version')::integer,'price_paise',(x->>'price_paise')::integer,'duration_minutes',(x->>'duration_minutes')::integer) order by x->>'id')
    into canonical_items from jsonb_array_elements(items) x;
  fingerprint_value := salon_private.hash(jsonb_build_object('name',name_value,'phone',normalized,'services',canonical_items,'preference',preferred,'source',source_value,'actor',actor,'capability_hash',salon_private.hash(cap))::text);
  select * into receipt from salon_private.operation_receipts where scope='admission' and request_key=request_value;
  if found then
    if receipt.fingerprint <> fingerprint_value then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    select * into row_data from salon_private.queue_entries where id=receipt.entry_id;
    if row_data.terminal_at is not null and salon_private.now() >= row_data.terminal_at + interval '24 hours' then raise exception 'STATUS_UNAVAILABLE'; end if;
    return receipt.response;
  end if;
  select * into config from salon_private.settings where id;
  if preferred is not null and not exists(select 1 from salon_private.barbers where id=preferred and on_duty) then raise exception 'BARBER_UNAVAILABLE'; end if;
  if not exists(select 1 from salon_private.barbers where on_duty) then raise exception 'NO_BARBERS'; end if;
  for selection in select value from jsonb_array_elements(canonical_items) loop
    select * into service from salon_private.services where id=(selection.value->>'id')::uuid and enabled;
    if not found then raise exception 'SERVICE_UNAVAILABLE'; end if;
    if service.version is distinct from (selection.value->>'version')::integer
      or service.price_paise is distinct from (selection.value->>'price_paise')::integer
      or service.duration_minutes is distinct from (selection.value->>'duration_minutes')::integer then raise exception 'CATALOG_CHANGED'; end if;
    price_total := price_total + service.price_paise; minute_total := minute_total + service.duration_minutes;
  end loop;
  if exists(select 1 from salon_private.queue_entries where phone=normalized and status in ('waiting','called','in_chair')) then raise exception 'ACTIVE_ENTRY_EXISTS'; end if;
  -- Clock is checked AFTER waiting for the serialization lock and immediately before writes.
  decision_time := salon_private.now(); local_clock := (decision_time at time zone 'Asia/Kolkata')::time;
  if local_clock < config.opening_time or local_clock >= config.closing_time then raise exception 'SALON_CLOSED'; end if;
  if source_value='remote' and (not config.online_enabled or local_clock >= config.closing_time - interval '30 minutes') then raise exception 'ONLINE_CLOSED'; end if;
  insert into salon_private.queue_entries(customer_name,phone,capability_hash,preferred_barber_id,source,total_paise,total_minutes,created_at)
    values(name_value,normalized,salon_private.hash(cap),preferred,source_value,price_total,minute_total,decision_time) returning * into row_data;
  insert into salon_private.queue_entry_services(entry_id,service_id,name_en,name_gu,price_paise,duration_minutes)
    select row_data.id,s.id,s.name_en,s.name_gu,s.price_paise,s.duration_minutes from salon_private.services s
    where s.id in (select (x->>'id')::uuid from jsonb_array_elements(canonical_items) x);
  insert into salon_private.operation_receipts(scope,request_key,fingerprint,entry_id,response)
    values('admission',request_value,fingerprint_value,row_data.id,jsonb_build_object('locator',row_data.locator,'token',row_data.token));
  perform salon_private.signal();
  return jsonb_build_object('locator',row_data.locator,'token',row_data.token);
end $$;

-- Only the Edge Function's backend credential may invoke this gateway.
create function public.salonq_gateway(action text, payload jsonb default '{}'::jsonb, actor uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare entry salon_private.queue_entries; receipt salon_private.operation_receipts; result jsonb;
begin
  if action='public_snapshot' then return salon_private.public_snapshot(); end if;
  if action='admit' then return salon_private.admit(payload,actor); end if;
  if action='receipt' then
    select * into receipt from salon_private.operation_receipts where scope='admission' and request_key=payload->>'request_key';
    if not found then raise exception 'STATUS_UNAVAILABLE'; end if;
    select locator into result from (select to_jsonb(e.locator) as locator from salon_private.queue_entries e where e.id=receipt.entry_id) q;
    entry := salon_private.customer_entry(result #>> '{}', payload->>'capability');
    return receipt.response;
  end if;
  if action in ('status','cancel') then
    if action='cancel' then perform salon_private.lock_queue(); end if;
    entry := salon_private.customer_entry(payload->>'locator',payload->>'capability');
    if action='cancel' then
      -- Same capability + terminal cancellation is a safe retry, never another transition.
      if entry.status='cancelled' then return salon_private.entry_payload(entry.id); end if;
      if entry.status <> 'waiting' then raise exception 'INVALID_TRANSITION'; end if;
      update salon_private.queue_entries set status='cancelled',terminal_at=salon_private.now() where id=entry.id;
      perform salon_private.signal();
    end if;
    return salon_private.entry_payload(entry.id);
  end if;
  raise exception 'INVALID_ACTION';
end $$;
revoke all on function public.salonq_gateway(text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.salonq_gateway(text,jsonb,uuid) to service_role;

create function public.salonq_rate_limit(bucket_hash text, max_attempts integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare current_minute timestamptz := date_trunc('minute',salon_private.now()); used integer;
begin
  if bucket_hash !~ '^[0-9a-f]{64}$' or max_attempts not between 1 and 120 then raise exception 'INVALID_INPUT'; end if;
  insert into salon_private.rate_buckets as b(bucket_hash,window_start,attempts) values(bucket_hash,current_minute,1)
    on conflict on constraint rate_buckets_pkey do update set attempts=b.attempts+1 returning attempts into used;
  delete from salon_private.rate_buckets where window_start < current_minute - interval '1 day';
  return used <= max_attempts;
end $$;
revoke all on function public.salonq_rate_limit(text,integer) from public, anon, authenticated;
grant execute on function public.salonq_rate_limit(text,integer) to service_role;

create function salon_private.staff_snapshot(actor uuid) returns jsonb language plpgsql stable set search_path = '' as $$
declare profile salon_private.staff_profiles; clock_value timestamptz := salon_private.now(); day_start timestamptz; day_end timestamptz; snapshot jsonb;
begin
  profile := salon_private.staff(actor,array['owner','receptionist','barber']);
  if profile.role='barber' then
    return jsonb_build_object('server_time',clock_value,'barber',(select to_jsonb(b) from salon_private.barbers b where id=profile.barber_id),
      'current',(select salon_private.entry_payload(e.id) || jsonb_build_object('entry_id',e.id) from salon_private.queue_entries e where assigned_barber_id=profile.barber_id and status in ('called','in_chair')),
      'next',(select jsonb_build_object('token',e.token,'customer_name',e.customer_name,'services',(salon_private.entry_payload(e.id))->'services') from salon_private.queue_entries e
        where status='waiting' and (preferred_barber_id is null or preferred_barber_id=profile.barber_id) order by sequence limit 1));
  end if;
  snapshot := jsonb_build_object('server_time',clock_value,'barbers',(select jsonb_agg(to_jsonb(b) order by slug) from salon_private.barbers b),
    'entries',coalesce((select jsonb_agg(salon_private.entry_payload(e.id) || jsonb_build_object('entry_id',e.id) order by sequence)
      from salon_private.queue_entries e where status in ('waiting','called','in_chair')),'[]'::jsonb));
  if profile.role='owner' then
    day_start := date_trunc('day',clock_value at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
    day_end := day_start + interval '1 day';
    snapshot := snapshot || jsonb_build_object('settings',(select to_jsonb(s) from salon_private.settings s where id),
      'services',coalesce((select jsonb_agg(to_jsonb(s) order by name_en) from salon_private.services s),'[]'::jsonb),
      'statistics',(select jsonb_build_object('served',count(*) filter(where status='done'),
        'average_wait_minutes',round(avg(extract(epoch from(called_at-created_at))/60) filter(where status='done'),1),
        'no_shows',count(*) filter(where status='no_show')) from salon_private.queue_entries where terminal_at >= day_start and terminal_at < day_end));
  end if;
  return snapshot;
end $$;

create function public.salonq_staff_profile() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare profile salon_private.staff_profiles;
begin
  profile := salon_private.staff(auth.uid(),array['owner','receptionist','barber']);
  return jsonb_build_object('user_id',profile.user_id,'role',profile.role,'barber_id',profile.barber_id);
end $$;
revoke all on function public.salonq_staff_profile() from public, anon;
grant execute on function public.salonq_staff_profile() to authenticated;

create function public.salonq_staff_command(action text, payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare profile salon_private.staff_profiles; actor uuid := auth.uid(); receipt salon_private.operation_receipts;
  req text; fingerprint_value text; scope_value text; result jsonb; target uuid; entry salon_private.queue_entries;
  barber salon_private.barbers; catalog salon_private.services; config salon_private.settings; clock_value timestamptz;
begin
  profile := salon_private.staff(actor,array['owner','receptionist','barber']);
  if action='snapshot' then return salon_private.staff_snapshot(actor); end if;
  if action='admit' then return salon_private.admit(payload,actor); end if;
  perform salon_private.lock_queue();
  req := payload->>'request_key';
  if req is null or req !~ '^[0-9a-f]{32,64}$' then raise exception 'INVALID_INPUT'; end if;
  scope_value := 'staff:' || actor::text;
  fingerprint_value := salon_private.hash(jsonb_build_object('action',action,'payload',payload)::text);
  select * into receipt from salon_private.operation_receipts where scope=scope_value and request_key=req;
  if found then
    if receipt.fingerprint <> fingerprint_value then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return receipt.response;
  end if;
  clock_value := salon_private.now();
  if action='call_next' then
    perform salon_private.staff(actor,array['owner','receptionist']);
    target := (payload->>'barber_id')::uuid;
    select * into barber from salon_private.barbers where id=target;
    if not found or not barber.on_duty or barber.on_break then raise exception 'BARBER_UNAVAILABLE'; end if;
    if exists(select 1 from salon_private.queue_entries where assigned_barber_id=target and status in ('called','in_chair')) then raise exception 'BARBER_BUSY'; end if;
    select * into entry from salon_private.queue_entries where status='waiting' and (preferred_barber_id is null or preferred_barber_id=target) order by sequence limit 1;
    if found then
      update salon_private.queue_entries set status='called',assigned_barber_id=target,called_at=clock_value where id=entry.id;
      result := salon_private.entry_payload(entry.id) || jsonb_build_object('entry_id',entry.id);
    else result := jsonb_build_object('entry_id',null,'reason','NO_ELIGIBLE_CUSTOMER'); end if;
  elsif action in ('start','done','cancel','no_show') then
    select * into entry from salon_private.queue_entries where id=(payload->>'entry_id')::uuid;
    if not found then raise exception 'ENTRY_UNAVAILABLE'; end if;
    if action in ('start','done') then
      if profile.role <> 'barber' or profile.barber_id is distinct from entry.assigned_barber_id then raise exception 'FORBIDDEN'; end if;
    else perform salon_private.staff(actor,array['owner','receptionist']); end if;
    if entry.version is distinct from (payload->>'version')::integer then raise exception 'STALE_VERSION'; end if;
    if (action='start' and entry.status <> 'called') or (action='done' and entry.status <> 'in_chair')
      or (action='cancel' and entry.status <> 'waiting') or (action='no_show' and entry.status <> 'called') then raise exception 'INVALID_TRANSITION'; end if;
    if action='no_show' and clock_value < entry.called_at + interval '10 minutes' then raise exception 'NO_SHOW_TOO_EARLY'; end if;
    update salon_private.queue_entries set status=case action when 'start' then 'in_chair' when 'done' then 'done' when 'cancel' then 'cancelled' else 'no_show' end,
      started_at=case when action='start' then clock_value else started_at end,
      terminal_at=case when action in ('done','cancel','no_show') then clock_value else null end where id=entry.id;
    result := salon_private.entry_payload(entry.id) || jsonb_build_object('entry_id',entry.id);
  elsif action='set_duty' then
    target := (payload->>'barber_id')::uuid;
    if profile.role='barber' then
      if profile.barber_id is distinct from target or payload->>'on_duty' is distinct from 'true' then raise exception 'FORBIDDEN'; end if;
    elsif profile.role <> 'owner' then raise exception 'FORBIDDEN'; end if;
    select * into barber from salon_private.barbers where id=target;
    if not found then raise exception 'BARBER_UNAVAILABLE'; end if;
    if profile.role='barber' and not barber.on_duty then raise exception 'FORBIDDEN'; end if;
    if barber.version is distinct from (payload->>'version')::integer then raise exception 'STALE_VERSION'; end if;
    if exists(select 1 from salon_private.queue_entries where assigned_barber_id=target and status in ('called','in_chair')) then raise exception 'BARBER_BUSY'; end if;
    if payload->>'on_duty'='false' and exists(select 1 from salon_private.queue_entries where status='waiting' and preferred_barber_id=target) then raise exception 'BARBER_HAS_WAITING'; end if;
    update salon_private.barbers set on_duty=(payload->>'on_duty')::boolean,on_break=(payload->>'on_break')::boolean,version=version+1 where id=target returning to_jsonb(salon_private.barbers.*) into result;
  elsif action='save_service' then
    perform salon_private.staff(actor,array['owner']);
    target := nullif(payload->>'id','')::uuid;
    if target is null then
      insert into salon_private.services(name_en,name_gu,price_paise,duration_minutes,enabled)
        values(btrim(payload->>'name_en'),btrim(payload->>'name_gu'),(payload->>'price_paise')::integer,(payload->>'duration_minutes')::integer,(payload->>'enabled')::boolean) returning * into catalog;
    else
      update salon_private.services set name_en=btrim(payload->>'name_en'),name_gu=btrim(payload->>'name_gu'),price_paise=(payload->>'price_paise')::integer,
        duration_minutes=(payload->>'duration_minutes')::integer,enabled=(payload->>'enabled')::boolean,version=version+1
        where id=target and version=(payload->>'version')::integer returning * into catalog;
      if not found then raise exception 'STALE_VERSION'; end if;
    end if;
    result := to_jsonb(catalog);
  elsif action='save_settings' then
    perform salon_private.staff(actor,array['owner']);
    update salon_private.settings set salon_name=btrim(payload->>'salon_name'),opening_time=(payload->>'opening_time')::time,
      closing_time=(payload->>'closing_time')::time,online_enabled=(payload->>'online_enabled')::boolean,version=version+1
      where id and version=(payload->>'version')::integer returning * into config;
    if not found then raise exception 'STALE_VERSION'; end if;
    result := to_jsonb(config);
  else raise exception 'INVALID_ACTION'; end if;
  insert into salon_private.operation_receipts(scope,request_key,fingerprint,entry_id,response)
    values(scope_value,req,fingerprint_value,entry.id,result);
  perform salon_private.signal();
  return result;
end $$;
revoke all on function public.salonq_staff_command(text,jsonb) from public, anon;
grant execute on function public.salonq_staff_command(text,jsonb) to authenticated;
revoke all on all functions in schema salon_private from public, anon, authenticated;

commit;
