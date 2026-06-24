# WhatsApp Booking Assistant Dashboard

Premium multi-tenant live chat dashboard for aesthetic and skin clinics.

Stack:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Realtime)

This app sits on top of your existing Python/Flask WhatsApp bot and shares the same Supabase database.

## 1. Local Setup

1. Install dependencies:

	npm install

2. Copy environment variables:

	cp .env.example .env.local

3. Fill in .env.local values:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- WHATSAPP_TOKEN

4. Run development server:

	npm run dev

5. Open:

	http://localhost:3000

## 2. Supabase Migration Run Order

Run these scripts in the Supabase SQL editor, one-by-one, in exact order:

1. supabase/migrations/001_create_tables.sql
2. supabase/migrations/002_create_enums.sql
3. supabase/migrations/003_enable_rls.sql
4. supabase/migrations/004_rls_policies.sql
5. supabase/migrations/005_indexes.sql
6. supabase/migrations/006_realtime.sql
7. supabase/migrations/007_seed_example.sql

Details are also listed in supabase/migrations/README.md.

## 3. Create First Clinic + Clinic User Mapping

1. In Supabase Auth, create an email/password user for the clinic owner/staff.
2. Copy the created auth user UUID.
3. Open supabase/migrations/007_seed_example.sql.
4. Replace placeholders:

- clinic UUID (or keep the sample UUID)
- clinic name
- Meta phone_number_id
- display number
- auth user UUID
- staff email and role

5. Uncomment the SQL in 007_seed_example.sql and run it.

If a user signs in but has no clinic_users row mapped to their auth user ID, the dashboard shows a clear No clinic assigned state.

## 4. Dashboard Features

- Email/password login with Supabase Auth
- Tenant isolation via RLS policies (clinic-scoped data only)
- Conversation list with:
  - patient label
  - latest message preview
  - relative timestamp
  - Bot / Needs attention / Human badge
- Realtime conversation and message updates via Supabase subscriptions
- Chat view with styled patient/bot/staff bubbles
- Take Over button (sets conversations.status = human)
- Return to Bot button (sets conversations.status = bot)
- Staff reply composer enabled only in human mode
- Reply flow writes messages row first, then calls app/api/send-message

Needs attention logic:

- Always true when status = human
- Or true when latest message is inbound and older than 5 minutes

## 5. WhatsApp Send Route

Endpoint:

- POST /api/send-message

Behavior:

- Verifies the signed-in user from bearer token
- Resolves the user clinic via clinic_users
- Loads clinic phone_number_id and conversation patient number
- Builds request to:
  - https://graph.facebook.com/v19.0/{phone_number_id}/messages
- Uses WHATSAPP_TOKEN as bearer token
- If WHATSAPP_TOKEN is missing or still a placeholder, returns stubbed success output for safe local development

## 6. How This Stays in Sync With Flask Bot

The Flask bot and this dashboard share the same Supabase tables:

- Bot inserts inbound/outbound bot messages into messages
- Bot upserts/updates conversations (especially last_message_at and booking_stage)
- Bot checks conversations.status before replying:
  - bot: bot can auto-reply
  - human: bot stays silent, clinic staff replies from dashboard

Because the dashboard subscribes to Realtime on conversations and messages, staff see bot activity and patient messages live without refresh.
