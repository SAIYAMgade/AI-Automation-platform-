"use client";

import { create } from "zustand";
import type { Channel, ConversationSummary, QueryIntent, RetrievedKnowledgeChunk } from "@/types/domain";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "human_agent";
  content: string;
  createdAt: string;
  pending?: boolean;
};

export type ChatTelemetry = {
  requestId?: string;
  conversationId?: string;
  intent?: QueryIntent;
  confidence?: number;
  requiresHuman?: boolean;
  latencyMs?: number;
  escalation?: {
    id: string;
    reason: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  };
  retrievedDocuments?: RetrievedKnowledgeChunk[];
};

export type AnalyticsOverview = {
  totalQueries: number;
  automationRate: number;
  escalations: number;
  averageConfidence: number;
  p95LatencyMs: number;
  intentBreakdown: Array<{ intent: QueryIntent; count: number }>;
};

type ChatState = {
  channel: Channel;
  messages: ChatMessage[];
  conversations: ConversationSummary[];
  telemetry: ChatTelemetry;
  analytics?: AnalyticsOverview;
  isStreaming: boolean;
  error?: string;
  darkMode: boolean;
  setChannel: (channel: Channel) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setConversations: (conversations: ConversationSummary[]) => void;
  setTelemetry: (telemetry: ChatTelemetry) => void;
  setAnalytics: (analytics: AnalyticsOverview) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error?: string) => void;
  toggleDarkMode: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  channel: "DASHBOARD",
  messages: [
    {
      id: "system-welcome",
      role: "system",
      content:
        "BookLeaf AI is ready. Try asking: When will my royalty arrive for Dreams of Fire?",
      createdAt: new Date().toISOString(),
    },
  ],
  conversations: [],
  telemetry: {},
  isStreaming: false,
  darkMode: true,
  setChannel: (channel) => set({ channel }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    })),
  setConversations: (conversations) => set({ conversations }),
  setTelemetry: (telemetry) => set({ telemetry }),
  setAnalytics: (analytics) => set({ analytics }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setError: (error) => set({ error }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
