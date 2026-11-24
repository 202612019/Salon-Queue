-- Phase 3 read-projection extension only. Reuse the existing authoritative estimator.
-- Existing migrations, private capabilities, grants and queue mutations are unchanged.
begin;
create or replace function salon_private.public_snapshot() returns jsonb language plpgsql stable set search_path = '' as $$
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
      'token',e.token,'status',e.status,'called_at',e.called_at,
      'estimate',salon_private.estimate(9223372036854775807,b.id)) order by b.slug)
      from salon_private.barbers b left join salon_private.queue_entries e on e.assigned_barber_id=b.id and e.status in ('called','in_chair')),'[]'::jsonb),
    'next_tokens',coalesce((select jsonb_agg(jsonb_build_object('token',q.token,'estimate',salon_private.estimate(q.sequence,q.preferred_barber_id)) order by q.sequence)
      from (select token,sequence,preferred_barber_id from salon_private.queue_entries where status='waiting' order by sequence limit 5) q),'[]'::jsonb)
  );
end $$;
revoke all on function salon_private.public_snapshot() from public, anon, authenticated;
select salon_private.signal();
commit;
