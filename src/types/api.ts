import { z } from "zod";
import { CHANNELS } from "@/types/domain";

export const contactIdentitySchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).max(24).optional(),
  instagramHandle: z.string().min(2).max(64).optional(),
  dashboardUserId: z.string().min(2).max(128).optional(),
  displayName: z.string().min(2).max(128).optional(),
  externalId: z.string().min(2).max(128).optional(),
});

export const chatRequestSchema = z.object({
  query: z.string().min(2).max(4000),
  channel: z.enum(CHANNELS).default("DASHBOARD"),
  conversationId: z.string().uuid().optional(),
  externalThreadId: z.string().max(256).optional(),
  identity: contactIdentitySchema.default({}),
  stream: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const escalationRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  reason: z.string().min(4).max(2000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const ingestDocumentSchema = z.object({
  title: z.string().min(2).max(200),
  source: z.string().min(2).max(300),
  category: z.string().min(2).max(80),
  content: z.string().min(20),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const ingestRequestSchema = z.object({
  documents: z.array(ingestDocumentSchema).min(1).max(25),
  async: z.boolean().default(true),
});
