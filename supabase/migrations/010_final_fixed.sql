-- Grant table-level access to the authenticated role
GRANT SELECT ON public.clinic_users   TO authenticated;
GRANT SELECT ON public.clinics        TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages      TO authenticated;

-- clinic_users: only select needed (inserts are done by service role / admin)
-- If you ever need staff to update their own row:
-- GRANT UPDATE ON public.clinic_users TO authenticated;
