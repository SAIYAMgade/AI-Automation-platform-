import { z } from "zod";

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SUPPORT_QUEUE_WEBHOOK_URL: z.string().url().optional(),
  REQUIRE_STAFF_AUTH: booleanFromEnv.default(false),
  RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_DURATION_SECONDS: z.coerce.number().int().positive().default(60),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.8),
  RAG_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.72),
  USE_MOCK_DATA: booleanFromEnv.default(true),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
  REDIS_URL: process.env.REDIS_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SUPPORT_QUEUE_WEBHOOK_URL: process.env.SUPPORT_QUEUE_WEBHOOK_URL,
  REQUIRE_STAFF_AUTH: process.env.REQUIRE_STAFF_AUTH,
  RATE_LIMIT_POINTS: process.env.RATE_LIMIT_POINTS,
  RATE_LIMIT_DURATION_SECONDS: process.env.RATE_LIMIT_DURATION_SECONDS,
  AI_CONFIDENCE_THRESHOLD: process.env.AI_CONFIDENCE_THRESHOLD,
  RAG_SIMILARITY_THRESHOLD: process.env.RAG_SIMILARITY_THRESHOLD,
  USE_MOCK_DATA: process.env.USE_MOCK_DATA,
});

export const runtimeFlags = {
  hasOpenAI: Boolean(env.OPENAI_API_KEY),
  hasDatabase: Boolean(env.DATABASE_URL),
  hasSupabaseAdmin: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  hasRedis: Boolean(env.REDIS_URL),
  shouldUseMockData: env.USE_MOCK_DATA || !env.DATABASE_URL,
};
