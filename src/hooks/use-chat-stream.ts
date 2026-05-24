"use client";

import { useCallback } from "react";
import { useChatStore } from "@/store/chat-store";
import type { ChatRequest } from "@/types/api";

export function useChatStream() {
  const {
    channel,
    addMessage,
    updateMessage,
    setTelemetry,
    setStreaming,
    setError,
  } = useChatStore();

  const sendMessage = useCallback(
    async (
      query: string,
      options: Partial<Pick<ChatRequest, "identity" | "channel" | "metadata" | "externalThreadId">> = {},
    ) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      const userMessageId = crypto.randomUUID();
      const assistantMessageId = crypto.randomUUID();

      addMessage({
        id: userMessageId,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      });

      addMessage({
        id: assistantMessageId,
        role: "assistant",
        content: "",
        pending: true,
        createdAt: new Date().toISOString(),
      });

      setError(undefined);
      setStreaming(true);

      try {
        const payload: ChatRequest = {
          query: trimmed,
          channel: options.channel ?? channel,
          stream: true,
          identity: options.identity ?? inferDemoIdentity(trimmed),
          externalThreadId: options.externalThreadId,
          metadata: { ui: "customer_portal", ...options.metadata },
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          throw new Error("The automation endpoint did not return a stream.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let content = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const event of events) {
            const parsed = parseSseEvent(event);
            if (!parsed) continue;

            if (parsed.event === "metadata") {
              setTelemetry(parsed.data);
            }

            if (parsed.event === "token") {
              content += parsed.data.token ?? "";
              updateMessage(assistantMessageId, {
                content,
                pending: false,
              });
            }

            if (parsed.event === "done") {
              updateMessage(assistantMessageId, {
                content: parsed.data.response ?? content,
                pending: false,
              });
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected chat failure.";
        setError(message);
        updateMessage(assistantMessageId, {
          content: "BookLeaf AI is temporarily unavailable. A support specialist can review this request.",
          pending: false,
        });
      } finally {
        setStreaming(false);
      }
    },
    [addMessage, channel, setError, setStreaming, setTelemetry, updateMessage],
  );

  return { sendMessage };
}

function parseSseEvent(raw: string) {
  const event = raw.match(/^event:\s*(.+)$/m)?.[1];
  const dataLine = raw.match(/^data:\s*(.+)$/m)?.[1];
  if (!event || !dataLine) return null;

  return {
    event,
    data: JSON.parse(dataLine),
  };
}

function inferDemoIdentity(query: string) {
  const lower = query.toLowerCase();

  if (lower.includes("sara") || lower.includes("dreams of fire")) {
    return {
      email: "sara.johnson@gmail.com",
      instagramHandle: "@sarapoetry23",
      displayName: "Sara Johnson",
    };
  }

  if (lower.includes("arjun") || lower.includes("monsoon")) {
    return {
      phone: "+919812345002",
      displayName: "Arjun Mehta",
    };
  }

  if (lower.includes("nisha") || lower.includes("paper boats")) {
    return {
      email: "nisha.kapoor@gmail.com",
      displayName: "Nisha Kapoor",
    };
  }

  return {
    displayName: "Dashboard Author",
  };
}
