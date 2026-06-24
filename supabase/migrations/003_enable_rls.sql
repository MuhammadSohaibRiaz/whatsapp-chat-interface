-- 003_enable_rls.sql
-- Enables Row Level Security on all application tables.
-- Run this after 002_create_enums.sql.

alter table if exists public.clinics enable row level security;
alter table if exists public.clinic_users enable row level security;
alter table if exists public.conversations enable row level security;
alter table if exists public.messages enable row level security;
