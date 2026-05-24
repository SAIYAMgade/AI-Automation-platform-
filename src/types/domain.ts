export const CHANNELS = [
  "EMAIL",
  "WHATSAPP",
  "INSTAGRAM",
  "DASHBOARD",
  "API",
  "SLACK",
] as const;

export type Channel = (typeof CHANNELS)[number];

export const QUERY_INTENTS = [
  "BOOK_STATUS",
  "ROYALTY_STATUS",
  "AUTHOR_COPY",
  "ISBN_STATUS",
  "ADDON_STATUS",
  "SALES_REPORT",
  "TIMELINE_QUERY",
  "DASHBOARD_ACCESS",
  "COMPANY_INFO",
  "KNOWLEDGE_BASE",
  "UNKNOWN",
] as const;

export type QueryIntent = (typeof QUERY_INTENTS)[number];

export type ContactIdentity = {
  email?: string;
  phone?: string;
  instagramHandle?: string;
  dashboardUserId?: string;
  displayName?: string;
  externalId?: string;
};

export type BookRecord = {
  id: string;
  authorId: string;
  title: string;
  status: string;
  isbn?: string | null;
  royaltyStatus: string;
  royaltyAmountDue?: string | number | null;
  royaltyPayoutDate?: Date | string | null;
  addOnServices?: Record<string, unknown>;
  finalSubmissionDate?: Date | string | null;
  bookLiveDate?: Date | string | null;
  authorCopyStatus: string;
  authorCopyTracking?: string | null;
  prPackageStatus: string;
  dashboardStatus: string;
  salesReportUrl?: string | null;
};

export type AuthorRecord = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  instagramHandle?: string | null;
  dashboardUserId?: string | null;
  locale?: string;
  metadata?: Record<string, unknown>;
  books: BookRecord[];
};

export type ConversationSummary = {
  id: string;
  authorName?: string | null;
  channel: Channel;
  status: "OPEN" | "RESOLVED" | "ESCALATED" | "WAITING_FOR_AUTHOR";
  lastMessage: string;
  confidence?: number | null;
  intent?: QueryIntent | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationThread = ConversationSummary & {
  messages: Array<{
    id: string;
    role: "USER" | "ASSISTANT" | "SYSTEM" | "HUMAN_AGENT";
    content: string;
    intent?: QueryIntent | null;
    aiConfidence?: number | null;
    createdAt: string;
  }>;
  escalation?: {
    id: string;
    reason: string;
    priority: EscalationPriority;
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
    createdAt: string;
  };
};

export type EscalationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type RetrievedKnowledgeChunk = {
  id: string;
  documentId: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
};
