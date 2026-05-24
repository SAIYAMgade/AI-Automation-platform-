# BookLeaf AI Query Automation Platform

Production-grade full-stack AI support automation for BookLeaf author operations. It combines intent detection, Supabase structured lookup, RAG over publishing knowledge, confidence-based human escalation, multi-channel adapters, observability, queues, and an enterprise operator console.

## 1. System Architecture Overview

BookLeaf uses a modular monolith: Next.js 15 hosts the dashboard and canonical `/api/*` routes, while an Express adapter exposes the same services for Helmet/CORS middleware, worker-adjacent deployments, and Supertest coverage. This keeps early-stage deployment simple while preserving clean service boundaries.

See [docs/architecture.md](docs/architecture.md) for the Mermaid diagram and scaling notes.

For the AI Automation Specialist assignment checklist, see [docs/technical-assignment-compliance.md](docs/technical-assignment-compliance.md).

## 2. Folder Structure

```txt
src/
  ai/                 OpenAI/LangChain clients, prompts, intent and response generation
  app/                Next.js App Router UI and REST API routes
  components/         SaaS dashboard and ShadCN-style UI primitives
  db/                 Prisma, Supabase, mock/runtime data
  hooks/              Streaming chat client logic
  lib/                env, auth, logging, security, API responses
  rag/                chunking, embeddings, pgvector retrieval, ingestion
  server/             Express adapter for Helmet/CORS and Supertest
  services/           orchestration, identity, escalation, analytics, queues, channels
  store/              Zustand UI state
  types/              Shared API/domain/AI contracts
  workers/            BullMQ document and escalation workers
tests/                Jest unit and API tests
prisma/               Prisma schema and seed
supabase/             pgvector schema, RPC, mock data
docs/                 Architecture and deployment guides
```

## 3. Database Schema

Core tables:

- `authors`, `author_identities`, `books`
- `conversations`, `messages`, `support_logs`
- `escalations`
- `knowledge_documents`, `knowledge_chunks`
- `webhook_events`

`supabase/schema.sql` enables `pgvector`, creates an HNSW vector index, and adds `match_knowledge_chunks()` for semantic retrieval. Prisma owns transactional application models in `prisma/schema.prisma`.

## 4. Backend Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

The app runs in safe mock mode by default. Set `USE_MOCK_DATA=false` with real `DATABASE_URL`, Supabase credentials, Redis, and OpenAI keys for production behavior.

## 5. AI Pipeline

`src/ai/intent-engine.ts` classifies:

- intent
- confidence
- entities
- ambiguity
- escalation need

It uses OpenAI structured output when configured and deterministic fallback logic for local tests. `src/ai/response-generator.ts` uses a grounded system prompt that forbids hallucinated dates, ISBNs, tracking IDs, payments, and statuses.

## 6. RAG Pipeline

`POST /api/ingest-documents` accepts knowledge documents, chunks them with LangChain, embeds them with OpenAI embeddings, and stores vectors in Supabase pgvector. Retrieval flow:

```txt
query -> embedding -> pgvector top-k -> context injection -> grounded answer
```

Redis caches retrieval results to reduce repeated embedding/vector calls.

## 7. Frontend Implementation

The dashboard resembles an Intercom/Zendesk-style AI console:

- streaming AI responses
- conversation history
- channel selector
- confidence and latency telemetry
- retrieved document panel
- escalation badges
- responsive layout
- dark mode
- Zustand state management
- Framer Motion message transitions

## 8. API Implementation

Canonical Next.js routes:

- `POST /api/chat`
- `POST /api/escalate`
- `POST /api/ingest-documents`
- `GET /api/conversations`
- `GET /api/analytics`

The Express adapter in `src/server/express-app.ts` exposes the same routes for tests and non-Vercel deployments.

## 9. Logging & Monitoring

Pino emits structured logs. Sentry is initialized through `instrumentation.ts`. Support logs persist:

- query
- response
- confidence
- intent
- retrieved document IDs
- latency
- failure/escalation reason

## 10. Escalation Engine

The orchestrator escalates when:

- confidence is below threshold
- intent is unknown
- identity has no match or multiple matches
- author/book records are ambiguous
- database facts are inconsistent

Escalations are written to storage and pushed to BullMQ for support queue notification.

## 11. Docker Setup

```bash
docker compose up --build
```

Compose starts Postgres with pgvector, Redis, the Next.js app, and two workers.

## 12. Deployment

Deploy Next.js to Vercel. Run BullMQ workers on Railway or Render. Use Supabase hosted Postgres with `supabase/schema.sql`. Full instructions are in [docs/deployment.md](docs/deployment.md).

## 13. Testing

```bash
npm run test
npm run lint
npm run typecheck
```

Tests cover intent classification, identity matching, and API behavior through Supertest.

## 14. README Notes

This is intentionally not a toy CRUD app. The code is structured so the first production iteration can run as a modular monolith, then split into independent services once traffic, team ownership, or channel-specific SLAs justify it.
