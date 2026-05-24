# Deployment Guide

## Local Production Simulation

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY` and Supabase credentials if using hosted Supabase.
3. Run `docker compose up --build`.
4. Open `http://localhost:3000`.

The compose stack starts:

- Next.js application
- PostgreSQL with `pgvector`
- Redis
- document ingestion worker
- escalation notification worker

## Vercel

Deploy the Next.js app to Vercel and set these variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `REDIS_URL`
- `SENTRY_DSN`
- `USE_MOCK_DATA=false`

Run workers separately on Railway or Render because Vercel functions are not long-lived.

## Railway / Render Workers

Create two worker services:

- `npm run worker:documents`
- `npm run worker:escalations`

Both need `REDIS_URL`. The document worker also needs `DATABASE_URL`, Supabase credentials, and `OPENAI_API_KEY`.

## Supabase Setup

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Run `supabase/mock-data.sql` for demo data.
3. Keep service role keys server-side only.
4. Keep RLS enabled and access operational tables only through server APIs.
