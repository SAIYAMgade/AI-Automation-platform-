"use client";

import { useEffect } from "react";
import { AnalyticsStrip } from "@/components/chat/analytics-strip";
import { ChannelRail } from "@/components/chat/channel-rail";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ConversationList } from "@/components/chat/conversation-list";
import { TelemetryPanel } from "@/components/chat/telemetry-panel";
import { useChatStore } from "@/store/chat-store";

export function BookLeafConsole() {
  const { setConversations, setAnalytics, darkMode } = useChatStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    async function hydrate() {
      const [conversationResponse, analyticsResponse] = await Promise.all([
        fetch("/api/conversations"),
        fetch("/api/analytics"),
      ]);

      if (conversationResponse.ok) {
        const payload = await conversationResponse.json();
        setConversations(payload.data);
      }

      if (analyticsResponse.ok) {
        const payload = await analyticsResponse.json();
        setAnalytics(payload.data);
      }
    }

    hydrate().catch(() => {
      // The chat surface remains usable even if telemetry hydration fails.
    });
  }, [setAnalytics, setConversations]);

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      <ChannelRail />
      <ConversationList />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border bg-background px-4 py-3 lg:px-6">
          <AnalyticsStrip />
        </div>
        <ChatPanel />
      </div>
      <TelemetryPanel />
    </div>
  );
}
