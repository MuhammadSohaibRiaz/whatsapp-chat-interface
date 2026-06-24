-- 004_rls_policies.sql
-- Creates tenant isolation policies so authenticated dashboard users only access their clinic rows.
-- Run this after 003_enable_rls.sql.

create or replace function public.current_user_clinic_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select cu.clinic_id
  from public.clinic_users cu
  where cu.auth_user_id = auth.uid()
$$;

revoke all on function public.current_user_clinic_ids() from public;
grant execute on function public.current_user_clinic_ids() to authenticated;

-- clinics
 drop policy if exists clinics_select_own on public.clinics;
create policy clinics_select_own
on public.clinics
for select
to authenticated
using (id in (select public.current_user_clinic_ids()));

drop policy if exists clinics_update_own on public.clinics;
create policy clinics_update_own
on public.clinics
for update
to authenticated
using (id in (select public.current_user_clinic_ids()))
with check (id in (select public.current_user_clinic_ids()));

-- clinic_users
 drop policy if exists clinic_users_select_own_clinic on public.clinic_users;
create policy clinic_users_select_own_clinic
on public.clinic_users
for select
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists clinic_users_insert_own_clinic on public.clinic_users;
create policy clinic_users_insert_own_clinic
on public.clinic_users
for insert
to authenticated
with check (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists clinic_users_update_own_clinic on public.clinic_users;
create policy clinic_users_update_own_clinic
on public.clinic_users
for update
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()))
with check (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists clinic_users_delete_own_clinic on public.clinic_users;
create policy clinic_users_delete_own_clinic
on public.clinic_users
for delete
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()));

-- conversations
 drop policy if exists conversations_select_own on public.conversations;
create policy conversations_select_own
on public.conversations
for select
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists conversations_insert_own on public.conversations;
create policy conversations_insert_own
on public.conversations
for insert
to authenticated
with check (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists conversations_update_own on public.conversations;
create policy conversations_update_own
on public.conversations
for update
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()))
with check (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists conversations_delete_own on public.conversations;
create policy conversations_delete_own
on public.conversations
for delete
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()));

-- messages
 drop policy if exists messages_select_own on public.messages;
create policy messages_select_own
on public.messages
for select
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists messages_insert_own on public.messages;
create policy messages_insert_own
on public.messages
for insert
to authenticated
with check (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists messages_update_own on public.messages;
create policy messages_update_own
on public.messages
for update
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()))
with check (clinic_id in (select public.current_user_clinic_ids()));

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own
on public.messages
for delete
to authenticated
using (clinic_id in (select public.current_user_clinic_ids()));
