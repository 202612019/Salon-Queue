-- Recheck CURRENT role/linkage before a stored retry receipt can be returned.
-- Keep the existing transactional implementation, locking and idempotency intact.
begin;
alter function public.salonq_staff_command(text,jsonb) set schema salon_private;
revoke all on function salon_private.salonq_staff_command(text,jsonb) from public, anon, authenticated;

create function public.salonq_staff_command(action text, payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare profile salon_private.staff_profiles; assigned uuid;
begin
  profile := salon_private.staff(auth.uid(),array['owner','receptionist','barber']);
  if action in ('call_next','cancel','no_show') then
    perform salon_private.staff(auth.uid(),array['owner','receptionist']);
  elsif action in ('start','done') then
    if profile.role <> 'barber' then raise exception 'FORBIDDEN'; end if;
    select assigned_barber_id into assigned from salon_private.queue_entries where id=(payload->>'entry_id')::uuid;
    if not found or assigned is distinct from profile.barber_id then raise exception 'FORBIDDEN'; end if;
  elsif action in ('save_service','save_settings') then
    perform salon_private.staff(auth.uid(),array['owner']);
  elsif action='set_duty' then
    if profile.role='barber' then
      if profile.barber_id is distinct from (payload->>'barber_id')::uuid or payload->>'on_duty' is distinct from 'true' then raise exception 'FORBIDDEN'; end if;
    elsif profile.role <> 'owner' then raise exception 'FORBIDDEN'; end if;
  elsif action not in ('snapshot','admit') then raise exception 'INVALID_ACTION';
  end if;
  return salon_private.salonq_staff_command(action,payload);
end $$;
revoke all on function public.salonq_staff_command(text,jsonb) from public, anon;
grant execute on function public.salonq_staff_command(text,jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
