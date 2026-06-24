-- 002_create_enums.sql
-- Reserved enum migration slot.
-- Enums are intentionally created in 001_create_tables.sql to keep dependent table creation atomic.
-- Run this after 001_create_tables.sql.

-- No-op by design.
select 'Enums were created in 001_create_tables.sql' as info;
