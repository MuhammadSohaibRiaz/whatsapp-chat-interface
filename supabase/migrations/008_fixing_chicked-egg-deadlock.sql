-- Let a user read their OWN clinic_users row directly, no clinic lookup.
drop policy if exists clinic_users_select_own_clinic on public.clinic_users;

create policy clinic_users_select_self
on public.clinic_users
for select
to authenticated
using (auth_user_id = auth.uid());