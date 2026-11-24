-- Optional fictional DEMONSTRATION catalog only. No customers, accounts or passwords.
-- Run after migrations. Online admission stays closed until the owner configures it.
begin;
select pg_advisory_xact_lock(7350141);
insert into salon_private.services(id,name_en,name_gu,price_paise,duration_minutes) values
 ('10000000-0000-4000-8000-000000000001','Signature haircut','સિગ્નેચર હેરકટ',15000,30),
 ('10000000-0000-4000-8000-000000000002','Beard sculpt','દાઢીનું શેપિંગ',8000,15),
 ('10000000-0000-4000-8000-000000000003','Hair & scalp ritual','વાળ અને માથાની સંભાળ',40000,45)
on conflict (id) do nothing;
insert into salon_private.barbers(id,slug,display_name) values
 ('20000000-0000-4000-8000-000000000001','ravi','Ravi'),
 ('20000000-0000-4000-8000-000000000002','amit','Amit'),
 ('20000000-0000-4000-8000-000000000003','imran','Imran')
on conflict (id) do nothing;
select salon_private.signal();
commit;
