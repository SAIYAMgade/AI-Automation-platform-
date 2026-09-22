# BookLeaf AI Support Platform

## Live demo

### [Open the live BookLeaf platform](https://ai-automation-platform-e6qi.onrender.com/login)

BookLeaf is a full-stack AI support platform for publishing operations. It combines grounded AI answers, author-specific records, Supabase/pgvector retrieval, identity matching, streaming chat, analytics, and human escalation in one responsive workspace.

> Demo login: `sara.johnson@gmail.com` / `bookleaf123`
>
> Admin demo: `admin@bookleaf.com` / `bookleaf123`

## What it does

- Answers author questions about publishing timelines, ISBNs, royalties, author copies, services, and pricing.
- Separates general BookLeaf knowledge from private author and book records.
- Uses confidence thresholds and grounding checks to prevent unsupported answers.
- Escalates uncertain, ambiguous, or missing-data requests to human support.
- Streams responses in the author portal and operator console.
- Supports Supabase, PostgreSQL/Prisma, Redis/BullMQ, OpenAI, and local mock mode.
- Includes customer, company-admin, analytics, escalation, ingestion, and multi-channel foundations.

## Grounded AI architecture

```text
Author message
      |
      v
Intent + entity extraction
      |
      +--> Author identity match --> Relational author/book records
      |
      +--> General policy question --> RAG / Supabase pgvector
      |
      v
Grounding gate + confidence check
      |
      +--> Verified answer
      |
      +--> Escalation ticket + human-support fallback
```

The platform deliberately keeps these retrieval tracks separate:

- General policies, pricing, publishing workflows, and service descriptions come from the knowledge base.
- ISBNs, royalty status, publishing dates, copy shipment details, and other account facts come from structured author/book records.
- If the required source does not contain a sufficiently grounded answer, the system escalates instead of guessing.

## Tech stack

| Area | Technology |
| --- | --- |
| Web app | Next.js 15, React 19, TypeScript, Tailwind CSS |
| AI | OpenAI, LangChain, structured intent classification |
| Retrieval | Supabase, PostgreSQL, pgvector, embeddings |
| Data layer | Prisma, Supabase service client, runtime mock store |
| Async work | Redis, BullMQ, document and escalation workers |
| UI | Responsive author portal, operator console, Framer Motion |
| Testing | Jest, Supertest, TypeScript, ESLint |
| Deployment | Render/Vercel-compatible Next.js deployment |

## Run locally

```bash
npm install
copy .env.example .env.local
npm run db:generate
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

The default development mode is safe mock mode, so the demo login and sample author records work without external credentials. For production integrations, set:

```env
USE_MOCK_DATA=false
DATABASE_URL=your-postgres-or-supabase-connection-string
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
OPENAI_API_KEY=your-openai-key
REDIS_URL=your-redis-url
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in browser code.

## Supabase setup

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor. It creates:

- authors, identities, app users, and books
- conversations, messages, support logs, and escalations
- knowledge documents and vector chunks
- LangChain-compatible `bookleaf_kb_chunks`
- `match_knowledge_chunks()` and `match_bookleaf_kb()` RPC functions
- structured `author_books` and `support_tickets`
- service-role RLS policies

The SQL keeps general knowledge-base content separate from private per-author facts.

## Project structure

```text
src/
  ai/                 Intent engine, prompts, OpenAI clients, response generation
  app/                Next.js pages and API routes
  components/         Author portal, operator console, auth, and UI primitives
  db/                 Prisma, Supabase, mock data, runtime store
  hooks/              Streaming chat hooks
  rag/                Chunking, embeddings, ingestion, and retrieval
  services/           Auth, identity, orchestration, escalation, analytics, queues
  server/             Express adapter for tests and worker-adjacent deployments
  workers/            Document-ingestion and escalation workers
  types/              Shared API, AI, domain, and orchestration contracts
supabase/             PostgreSQL/pgvector schema and mock data
prisma/               Prisma schema and seed data
tests/                Intent, identity, and API tests
docs/                 Architecture, deployment, and knowledge-base notes
```

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth` | Sign in or create an account |
| POST | `/api/chat` | Run grounded support automation |
| POST | `/api/escalate` | Create a manual-support escalation |
| POST | `/api/ingest-documents` | Ingest and embed knowledge documents |
| GET | `/api/conversations` | Read conversation history and work queues |
| GET | `/api/analytics` | Read support and automation metrics |

## Useful commands

```bash
npm run dev             # Start Next.js development server
npm run build           # Create a production build
npm run start           # Start the production server
npm run typecheck       # Run TypeScript validation
npm run lint            # Run ESLint
npm test                # Run the Jest test suite
npm run db:generate     # Generate Prisma client
npm run db:push         # Push Prisma schema to the configured database
npm run worker:documents
npm run worker:escalations
```

## Deployment

The current live deployment is available at:

**[https://ai-automation-platform-e6qi.onrender.com/login](https://ai-automation-platform-e6qi.onrender.com/login)**

For a production deployment, configure the environment variables above, run the Supabase schema, provision Redis for BullMQ, and deploy the Next.js web process alongside the document and escalation workers. See [docs/deployment.md](docs/deployment.md) for the deployment checklist.

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [BookLeaf knowledge base](docs/bookleaf-knowledge-base.md)
- [Technical assignment compliance](docs/technical-assignment-compliance.md)
- [Loom video script](docs/loom-video-script.md)

## Verification

The repository includes tests for intent classification, identity unification, API behavior, grounded retrieval, and escalation behavior.

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
```

## License

This project is private and intended for BookLeaf platform development.
