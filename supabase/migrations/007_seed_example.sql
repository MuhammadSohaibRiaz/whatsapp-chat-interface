begin;

-- 1) Create the clinic row
insert into public.clinics (id, name, phone_number_id, display_number)
values (
  '11111111-1111-1111-1111-111111111111',
  'Aesthetics Place',
  'REPLACE_WITH_REAL_PHONE_NUMBER_ID',
  '+92 XXX XXXXXXX'
)
on conflict (id) do update set
  name = excluded.name,
  phone_number_id = excluded.phone_number_id,
  display_number = excluded.display_number;

-- 2) Link YOUR auth user to that clinic
insert into public.clinic_users (clinic_id, auth_user_id, email, role)
values (
  '11111111-1111-1111-1111-111111111111',
  'ab3a0cb4-2593-44e3-a74a-7299a82b2d14',
  'azan@aestheticsplace.pk',
  'owner'
)
on conflict (auth_user_id) do update set
  clinic_id = excluded.clinic_id,
  email = excluded.email,
  role = excluded.role;

commit;


-- 007_seed_example.sql
-- Commented onboarding example for one clinic and one mapped clinic_user.
-- Run this after 006_realtime.sql.

-- 1) First create a user in Supabase Auth dashboard (email/password), then copy the user UUID.
-- 2) Uncomment and execute this script after replacing placeholders.

-- begin;
--
-- insert into public.clinics (id, name, phone_number_id, display_number)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'Luma Skin Clinic',
--   '123456789012345',
--   '+1 555 210 4455'
-- )
-- on conflict (id) do update set
--   name = excluded.name,
--   phone_number_id = excluded.phone_number_id,
--   display_number = excluded.display_number;
--
-- insert into public.clinic_users (clinic_id, auth_user_id, email, role)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'REPLACE_WITH_AUTH_USERS_UUID',
--   'owner@lumaskinclinic.com',
--   'owner'
-- )
-- on conflict (auth_user_id) do update set
--   clinic_id = excluded.clinic_id,
--   email = excluded.email,
--   role = excluded.role;
--
-- commit;
