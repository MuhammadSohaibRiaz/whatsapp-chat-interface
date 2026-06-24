# Supabase Migrations

Run each SQL file in order in the Supabase SQL editor:

1. `001_create_tables.sql`
2. `002_create_enums.sql`
3. `003_enable_rls.sql`
4. `004_rls_policies.sql`
5. `005_indexes.sql`
6. `006_realtime.sql`
7. `007_seed_example.sql`

Notes:

- Files are written to be idempotent where practical (`if not exists`, `drop policy if exists`).
- Run scripts top-to-bottom exactly in this sequence.
- `007_seed_example.sql` is intentionally commented out and serves as an onboarding reference.
