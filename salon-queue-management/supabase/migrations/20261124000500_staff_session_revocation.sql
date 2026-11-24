-- Reject a signed JWT once its Auth session has been revoked/sign-out removed it.
-- Roles, queue transactions and the retry authorization facade remain unchanged.
begin;
create function salon_private.session_active(actor uuid, session_id uuid) returns boolean
language sql stable set search_path='' as $$
  select exists(select 1 from auth.sessions s where s.id=session_id and s.user_id=actor
    and (s.not_after is null or s.not_after > clock_timestamp()))
$$;
revoke all on function salon_private.session_active(uuid,uuid) from public, anon, authenticated;

create or replace function salon_private.staff(actor uuid, allowed text[]) returns salon_private.staff_profiles
language plpgsql stable set search_path='' as $$
declare profile salon_private.staff_profiles; session_id uuid;
begin
  -- Authenticated RPCs get identity only from verified PostgREST JWT claims.
  if auth.uid() is not null then
    begin session_id := (auth.jwt()->>'session_id')::uuid;
    exception when invalid_text_representation then raise exception 'AUTH_REQUIRED'; end;
    if actor is distinct from auth.uid() or not salon_private.session_active(actor,session_id) then
      raise exception 'AUTH_REQUIRED';
    end if;
  end if;
  select * into profile from salon_private.staff_profiles where user_id=actor and enabled;
  if not found or not (profile.role=any(allowed)) then raise exception 'FORBIDDEN'; end if;
  return profile;
end $$;

-- The Edge Function first verifies the JWT with Auth, then checks that exact
-- actor/session before admitting a staff walk-in through its service-only gateway.
create function public.salonq_staff_session_active(actor uuid, session_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select salon_private.session_active(actor,session_id)
$$;
revoke all on function public.salonq_staff_session_active(uuid,uuid) from public, anon, authenticated;
grant execute on function public.salonq_staff_session_active(uuid,uuid) to service_role;
notify pgrst, 'reload schema';
commit;
