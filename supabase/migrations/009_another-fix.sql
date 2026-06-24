-- Link your new user account to the existing clinic
INSERT INTO public.clinic_users (clinic_id, auth_user_id, email, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',  -- existing clinic from seed
  'ab3a0cb4-2593-44e3-a74a-7299a82b2d14',
  'azan@aestheticsplace.pk',
  'owner'
)
ON CONFLICT (auth_user_id) DO UPDATE SET
  clinic_id = excluded.clinic_id,
  email     = excluded.email,
  role      = excluded.role;
