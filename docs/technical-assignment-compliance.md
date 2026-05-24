# AI Automation Specialist Assignment Compliance

## Mandatory Task: Customer Query Bot with Workflow-Aware Automation

| Requirement | Implementation |
| --- | --- |
| Accept natural language questions | `POST /api/chat`, `/author` customer chat UI |
| Match query to Supabase-like DB | `AuthorService`, Prisma schema, mocked author/book records in `src/db/mock-data.ts` |
| Respond with status and dates | `ResponseGenerator` answers book live date, final submission date, royalty status, ISBN, author copy, add-ons, dashboard access |
| Integrate knowledge base document | `docs/bookleaf-knowledge-base.md` and RAG chunks in `mockKnowledgeChunks` |
| Confidence < 80% escalation | `QueryOrchestrator.determineEscalationReason()` with `AI_CONFIDENCE_THRESHOLD` |
| Log all queries/responses | Prisma `support_logs` in production and `logs/support-events.jsonl` in mock mode |
| Use OpenAI / LLM | `IntentEngine` and `ResponseGenerator` use OpenAI/LangChain when `OPENAI_API_KEY` is configured |
| Embedding/RAG search | `rag/retrieval-service.ts`, `rag/ingest-service.ts`, OpenAI embeddings, Supabase pgvector RPC |
| Supabase-like DB with mock data | `prisma/schema.prisma`, `supabase/schema.sql`, `src/db/mock-data.ts` |
| DB down / no match / multiple matches handling | Runtime mock fallback, identity matching statuses, escalation rules |
| Chat-like interface | `/author` customer portal and `/company` staff inbox |
| Multi-channel ready | Channel adapters and channel-aware `POST /api/chat` payloads for Email, WhatsApp, Instagram, Dashboard, API |
| Loom explanation | Ready-to-record script in `docs/loom-video-script.md` |

## Knowledge Base Coverage Added

- 21-Day Writing Challenge
- Rs. 1999 package
- Refund and upgrade policy
- Dashboard login/password access
- Poem submission, Hindi writing, saving progress, rearranging poems
- Final submission review
- Cover creator, custom cover upload, template limits
- Back cover and profile photo guidance
- Publishing timelines and Rs. 8899 add-on
- Sales channels and royalties
- Copyright ownership
- Technical issues and email submission fallback

## Loom Video Talking Points

1. **Tech stack:** Next.js 15, TypeScript, Prisma, Supabase/pgvector, LangChain, OpenAI, Redis/BullMQ, Pino, Sentry.
2. **Why this architecture:** modular monolith for speed, service boundaries for future scaling, pgvector for simple RAG operations beside publishing data.
3. **Workflow:** customer asks question, AI classifies intent, identity engine matches author, structured DB and RAG retrieve facts, response is generated or escalated.
4. **Human escalation:** confidence threshold, no author match, multiple matches, unknown intent, or inconsistent DB state.
5. **What to improve:** real WhatsApp/Instagram/Gmail webhooks, Supabase Auth enforcement, persistent conversation storage in hosted Supabase, evaluation set for intent confidence, support-agent reply workflow.
