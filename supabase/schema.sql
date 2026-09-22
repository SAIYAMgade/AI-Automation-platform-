create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

do $$ begin
  create type channel as enum ('EMAIL', 'WHATSAPP', 'INSTAGRAM', 'DASHBOARD', 'API', 'SLACK');
exception when duplicate_object then null; end $$;

do $$ begin
  create type query_intent as enum (
    'BOOK_STATUS',
    'ROYALTY_STATUS',
    'AUTHOR_COPY',
    'ISBN_STATUS',
    'ADDON_STATUS',
    'SALES_REPORT',
    'TIMELINE_QUERY',
    'DASHBOARD_ACCESS',
    'COMPANY_INFO',
    'KNOWLEDGE_BASE',
    'UNKNOWN'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type conversation_status as enum ('OPEN', 'RESOLVED', 'ESCALATED', 'WAITING_FOR_AUTHOR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type escalation_status as enum ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type escalation_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_role as enum ('USER', 'ASSISTANT', 'SYSTEM', 'HUMAN_AGENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type identity_type as enum ('EMAIL', 'PHONE', 'INSTAGRAM', 'NAME', 'DASHBOARD_USER_ID', 'EXTERNAL_ID');
exception when duplicate_object then null; end $$;

create table if not exists authors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text unique,
  instagram_handle text unique,
  dashboard_user_id text unique,
  locale text not null default 'en-IN',
  identity_confidence double precision not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists author_identities (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references authors(id) on delete cascade,
  type identity_type not null,
  value text not null,
  normalized_value text not null,
  confidence double precision not null default 1,
  verified boolean not null default false,
  source channel not null,
  created_at timestamptz not null default now()
);

create index if not exists author_identities_lookup_idx on author_identities(type, normalized_value);
create index if not exists authors_full_name_trgm_idx on authors using gin (full_name gin_trgm_ops);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('customer', 'company')),
  display_name text,
  author_id uuid references authors(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_role_idx on app_users(role);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references authors(id) on delete cascade,
  title text not null,
  status text not null default 'IN_PRODUCTION',
  isbn text unique,
  royalty_status text not null default 'NOT_DUE',
  royalty_amount_due numeric(12,2) not null default 0,
  royalty_payout_date timestamptz,
  add_on_services jsonb not null default '{}'::jsonb,
  final_submission_date timestamptz,
  book_live_date timestamptz,
  author_copy_status text not null default 'NOT_DISPATCHED',
  author_copy_tracking text,
  pr_package_status text not null default 'NOT_STARTED',
  dashboard_status text not null default 'ACTIVE',
  sales_report_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_author_idx on books(author_id);
create index if not exists books_title_trgm_idx on books using gin (title gin_trgm_ops);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references authors(id) on delete set null,
  channel channel not null,
  external_thread_id text,
  status conversation_status not null default 'OPEN',
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role message_role not null,
  content text not null,
  intent query_intent,
  ai_confidence double precision,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists support_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  conversation_id uuid references conversations(id) on delete set null,
  author_id uuid references authors(id) on delete set null,
  channel channel not null,
  user_query text not null,
  ai_response text,
  intent query_intent not null,
  confidence double precision not null,
  retrieved_document_ids text[] not null default '{}',
  latency_ms integer not null,
  failure_reason text,
  requires_human boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists support_logs_channel_created_idx on support_logs(channel, created_at desc);
create index if not exists support_logs_intent_created_idx on support_logs(intent, created_at desc);
create index if not exists support_logs_human_created_idx on support_logs(requires_human, created_at desc);

create table if not exists escalations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete set null,
  author_id uuid references authors(id) on delete set null,
  reason text not null,
  status escalation_status not null default 'OPEN',
  priority escalation_priority not null default 'MEDIUM',
  assigned_to text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists escalations_status_priority_idx on escalations(status, priority, created_at desc);

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,
  category text not null,
  checksum text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  embedding_model text not null default 'text-embedding-3-small',
  token_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_document_idx on knowledge_chunks(document_id);
create index if not exists knowledge_chunks_embedding_hnsw_idx
  on knowledge_chunks using hnsw (embedding vector_cosine_ops);

create or replace function match_knowledge_chunks(
  query_embedding vector(1536),
  match_count integer default 5,
  similarity_threshold double precision default 0.72
)
returns table (
  id uuid,
  document_id uuid,
  title text,
  category text,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
as $$
  select
    kc.id,
    kc.document_id,
    kd.title,
    kd.category,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  join knowledge_documents kd on kd.id = kc.document_id
  where kc.embedding is not null
    and 1 - (kc.embedding <=> query_embedding) >= similarity_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;

alter table authors enable row level security;
alter table app_users enable row level security;
alter table books enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table support_logs enable row level security;
alter table escalations enable row level security;
alter table knowledge_documents enable row level security;
alter table knowledge_chunks enable row level security;

create policy "service role has full access to authors" on authors for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to app_users" on app_users for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to books" on books for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to conversations" on conversations for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to messages" on messages for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to support_logs" on support_logs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to escalations" on escalations for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to knowledge_documents" on knowledge_documents for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to knowledge_chunks" on knowledge_chunks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Optional LangChain-compatible knowledge-base tables.
-- Keep general policy/service content here; author-specific facts stay in
-- author_books (or the existing authors/books relational tables).
create table if not exists bookleaf_kb_chunks (
  id bigserial primary key,
  source text,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists bookleaf_kb_chunks_embedding_idx
  on bookleaf_kb_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function match_bookleaf_kb(
  query_embedding vector(1536),
  match_count integer default 4
)
returns table (
  id bigint,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from bookleaf_kb_chunks
  order by embedding <=> query_embedding
  limit match_count;
$$;

create table if not exists author_books (
  account_id uuid primary key references auth.users(id) on delete cascade,
  book_title text,
  isbn_status text,
  publish_date date,
  royalty_status text,
  copies_status text
);

create table if not exists support_tickets (
  id bigserial primary key,
  account_id uuid,
  query text not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table bookleaf_kb_chunks enable row level security;
alter table author_books enable row level security;
alter table support_tickets enable row level security;

create policy "service role has full access to bookleaf_kb_chunks" on bookleaf_kb_chunks
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to author_books" on author_books
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role has full access to support_tickets" on support_tickets
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
