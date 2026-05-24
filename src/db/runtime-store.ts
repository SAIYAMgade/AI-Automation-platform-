import { randomUUID } from "crypto";
import type { Channel, ConversationSummary, QueryIntent } from "@/types/domain";

export type RuntimeMessage = {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM" | "HUMAN_AGENT";
  content: string;
  intent?: QueryIntent;
  aiConfidence?: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type RuntimeEscalation = {
  id: string;
  conversationId?: string;
  authorId?: string;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
  payload: Record<string, unknown>;
  createdAt: string;
};

export type RuntimeSupportLog = {
  requestId: string;
  conversationId?: string;
  authorId?: string;
  channel: Channel;
  userQuery: string;
  aiResponse?: string;
  intent: QueryIntent;
  confidence: number;
  retrievedDocumentIds: string[];
  latencyMs: number;
  failureReason?: string;
  requiresHuman: boolean;
  createdAt: string;
};

export const runtimeStore = {
  conversations: [] as ConversationSummary[],
  messages: [] as RuntimeMessage[],
  escalations: [] as RuntimeEscalation[],
  supportLogs: [] as RuntimeSupportLog[],
};

export function makeConversation(input: {
  authorName?: string | null;
  channel: Channel;
  status?: ConversationSummary["status"];
  lastMessage: string;
  confidence?: number | null;
  intent?: QueryIntent | null;
}) {
  const now = new Date().toISOString();
  const conversation: ConversationSummary = {
    id: randomUUID(),
    authorName: input.authorName,
    channel: input.channel,
    status: input.status ?? "OPEN",
    lastMessage: input.lastMessage,
    confidence: input.confidence,
    intent: input.intent,
    createdAt: now,
    updatedAt: now,
  };
  runtimeStore.conversations.unshift(conversation);
  return conversation;
}
