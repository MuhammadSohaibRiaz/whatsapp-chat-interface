-- 006_realtime.sql
-- Enables Supabase Realtime publication entries for live dashboard updates.
-- Run this after 005_indexes.sql.

alter table public.conversations replica identity full;
alter table public.messages replica identity full;

-- Add conversations table to supabase_realtime publication if missing.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;

-- Add messages table to supabase_realtime publication if missing.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
