# Loom Video Script

Use this outline to record the assignment walkthrough.

## 1. Intro

Hi, this is the BookLeaf customer query automation system. It is a multi-channel-ready AI support bot for publishing workflows. It answers author questions from structured author/book data and a RAG knowledge base, and escalates uncertain cases to human support.

## 2. Tech Stack

- Frontend: Next.js 15 App Router, TypeScript, TailwindCSS, ShadCN-style UI, Framer Motion
- Backend: Next.js API routes plus an Express adapter
- AI: OpenAI-compatible LangChain chat model, structured intent classification, embeddings, RAG retrieval
- Database: Prisma schema for Supabase PostgreSQL-like data
- Vector Store: Supabase pgvector RPC design
- Queue and cache: Redis and BullMQ-ready services
- Logging: Pino plus persistent `logs/support-events.jsonl` in mock mode
- Monitoring: Sentry config hooks

## 3. Why This Architecture

I used a modular monolith because it is faster to ship and easier to review for an assignment, but the code is split by service boundaries: AI, RAG, identity matching, escalation, analytics, conversations, channel adapters, and persistence.

The design can later split into separate services for channel ingestion, AI orchestration, and support operations if traffic grows.

## 4. Demo Flow

1. Open `/login`.
2. Choose Customer / Author.
3. Ask a structured data question:
   - “When will my royalty arrive for Dreams of Fire?”
   - The bot detects `ROYALTY_STATUS`, matches Sara Johnson, reads mocked book data, and returns the payout status/date.
4. Ask a knowledge-base question:
   - “Can I use a pen name in the 21-Day Writing Challenge?”
   - The bot detects `KNOWLEDGE_BASE`, retrieves RAG content, and answers without needing an author record.
5. Ask an unclear question:
   - “Please check this thing for me.”
   - Confidence is low, so the system escalates.
6. Open Company Staff dashboard.
7. Show the live multi-channel inbox, confidence, intent, and escalation state.
8. Show `logs/support-events.jsonl` where every query and response is recorded.

## 5. Confidence and Escalation

The bot escalates when:

- AI confidence is below 80%
- intent is unknown
- no author match is found for account-specific questions
- multiple author profiles match
- database state is inconsistent

This prevents hallucinated answers and protects operational workflows.

## 6. RAG Knowledge Base

The knowledge base covers:

- 21-Day Writing Challenge
- Rs. 1999 publishing package
- refunds and upgrades
- login and dashboard access
- poem submission, Hindi writing, saving progress
- cover design and back cover info
- publishing timeline and Rs. 8899 add-on
- sales and royalties
- copyright ownership
- technical support and email fallback

## 7. What I Would Improve With More Time

- Add real Gmail, WhatsApp Business, and Instagram webhook integrations
- Use hosted Supabase with real RLS policies and Supabase Auth
- Add evaluation datasets for intent confidence and retrieval quality
- Add human-agent reply workflow from the company dashboard
- Add Slack notifications for escalations
- Add production analytics dashboards for automation rate and unresolved tickets
