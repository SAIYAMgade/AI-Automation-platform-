import type { IntentClassification, IdentityMatchResult } from "@/types/ai";
import type { Channel, QueryIntent, RetrievedKnowledgeChunk } from "@/types/domain";

export type ChatAutomationResult = {
  requestId: string;
  conversationId: string;
  response: string;
  intent: QueryIntent;
  confidence: number;
  requiresHuman: boolean;
  escalation?: {
    id: string;
    reason: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  };
  author?: {
    id: string;
    name: string;
  };
  identity: IdentityMatchResult;
  classification: IntentClassification;
  retrievedDocuments: RetrievedKnowledgeChunk[];
  latencyMs: number;
  channel: Channel;
};
