-- 001_create_tables.sql
-- Creates base extension, enums, and core tables for the WhatsApp assistant dashboard.
-- Run this first, before all subsequent migration scripts.

create extension if not exists pgcrypto;

-- Enum for who currently controls the conversation.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'conversation_status' and n.nspname = 'public'
  ) then
    create type public.conversation_status as enum ('bot', 'human', 'closed');
  end if;
end $$;

-- Enum for WhatsApp message direction.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'message_direction' and n.nspname = 'public'
  ) then
    create type public.message_direction as enum ('inbound', 'outbound');
  end if;
end $$;

-- Enum for message sender role.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'message_sender' and n.nspname = 'public'
  ) then
    create type public.message_sender as enum ('patient', 'bot', 'staff');
  end if;
end $$;

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number_id text not null unique,
  display_number text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_users (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null,
  created_at timestamptz not null default now(),
  unique (auth_user_id),
  unique (clinic_id, auth_user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_wa_number text not null,
  patient_name text,
  status public.conversation_status not null default 'bot',
  booking_stage text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  direction public.message_direction not null,
  sender public.message_sender not null,
  body text not null,
  created_at timestamptz not null default now()
);
