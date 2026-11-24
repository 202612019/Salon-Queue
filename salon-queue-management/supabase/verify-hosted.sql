-- Read-only hosted metadata verification. No customer records or credentials returned.
with private_tables as (
  select c.relname, c.relrowsecurity, c.oid
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='salon_private' and c.relkind='r'
), required_functions(signature) as (
  values ('public.salonq_gateway(text,jsonb,uuid)'),
    ('public.salonq_rate_limit(text,integer)'),
    ('public.salonq_staff_profile()'), ('public.salonq_staff_command(text,jsonb)')
)
select
  (select count(*)=8 and bool_and(relrowsecurity) from private_tables) as private_tables_rls,
  (select bool_and(not has_table_privilege('anon',oid,'select,insert,update,delete')
    and not has_table_privilege('authenticated',oid,'select,insert,update,delete')) from private_tables) as private_tables_denied,
  (select bool_and(to_regprocedure(signature) is not null) from required_functions) as required_functions_present,
  not has_function_privilege('anon','public.salonq_gateway(text,jsonb,uuid)','execute')
    and not has_function_privilege('authenticated','public.salonq_gateway(text,jsonb,uuid)','execute') as gateway_clients_denied,
  has_function_privilege('service_role','public.salonq_gateway(text,jsonb,uuid)','execute') as gateway_backend_allowed,
  has_function_privilege('authenticated','public.salonq_staff_command(text,jsonb)','execute')
    and not has_function_privilege('anon','public.salonq_staff_command(text,jsonb)','execute') as staff_execution_permissions,
  not has_function_privilege('anon','salon_private.salonq_staff_command(text,jsonb)','execute')
    and not has_function_privilege('authenticated','salon_private.salonq_staff_command(text,jsonb)','execute') as transaction_implementation_private,
  exists(select 1 from pg_indexes where schemaname='salon_private' and indexname='one_active_phone')
    and exists(select 1 from pg_indexes where schemaname='salon_private' and indexname='one_assignment_per_barber') as uniqueness_indexes_present,
  (select bool_and(indisunique and indpred is not null) from pg_index i join pg_class c on c.oid=i.indexrelid
    join pg_namespace n on n.oid=c.relnamespace where n.nspname='salon_private'
    and c.relname in ('one_active_phone','one_assignment_per_barber')) as active_constraints_partial_unique,
  exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='salon_private' and c.relname='queue_entries' and t.tgname='guard_entry' and not t.tgisinternal)
    and exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='salon_private' and c.relname='queue_entry_services' and t.tgname='immutable_snapshot' and not t.tgisinternal) as integrity_triggers_present,
  (select count(*)=1 and bool_and(tablename='salonq_changes' and schemaname='public')
    from pg_publication_tables where pubname='supabase_realtime' and (schemaname='salon_private' or tablename='salonq_changes')) as sanitized_publication_only,
  (select relrowsecurity from pg_class where oid='public.salonq_changes'::regclass) as signal_rls,
  has_table_privilege('anon','public.salonq_changes','select')
    and not has_table_privilege('anon','public.salonq_changes','insert,update,delete') as signal_read_only,
  (select count(*)=3 from salon_private.services where enabled) as three_enabled_demo_services,
  (select count(*)=3 from salon_private.barbers where slug in ('ravi','amit','imran')) as three_demo_barbers;
