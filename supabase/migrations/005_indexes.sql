-- 005_indexes.sql
-- Adds indexes for tenant-scoped conversation and message access patterns.
-- Run this after 004_rls_policies.sql.

create index if not exists clinic_users_auth_user_id_idx
  on public.clinic_users (auth_user_id);

create index if not exists clinic_users_clinic_id_idx
  on public.clinic_users (clinic_id);

create index if not exists conversations_clinic_last_message_at_idx
  on public.conversations (clinic_id, last_message_at desc);

create index if not exists conversations_patient_wa_number_idx
  on public.conversations (patient_wa_number);

create index if not exists messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at asc);

create index if not exists messages_clinic_created_at_idx
  on public.messages (clinic_id, created_at desc);
