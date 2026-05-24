import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { makeConversation, runtimeStore } from "@/db/runtime-store";
import { runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { Channel, ConversationSummary, ConversationThread, QueryIntent } from "@/types/domain";

export class ConversationService {
  async resolveConversation(input: { conversationId: string; note?: string }) {
    const resolvedAt = new Date().toISOString();

    if (runtimeFlags.shouldUseMockData) {
      const conversation = runtimeStore.conversations.find((item) => item.id === input.conversationId);
      if (conversation) {
        conversation.status = "RESOLVED";
        conversation.updatedAt = resolvedAt;
      }

      runtimeStore.escalations
        .filter((item) => item.conversationId === input.conversationId && item.status === "OPEN")
        .forEach((item) => {
          item.status = "RESOLVED";
        });

      if (input.note?.trim()) {
        runtimeStore.messages.push({
          id: crypto.randomUUID(),
          conversationId: input.conversationId,
          role: "HUMAN_AGENT",
          content: input.note.trim(),
          metadata: { action: "resolved" },
          createdAt: resolvedAt,
        });
      }

      return { id: input.conversationId, status: "RESOLVED" as const };
    }

    try {
      const [conversation] = await prisma.$transaction([
        prisma.conversation.update({
          where: { id: input.conversationId },
          data: {
            status: "RESOLVED",
            updatedAt: new Date(),
          },
        }),
        prisma.escalation.updateMany({
          where: {
            conversationId: input.conversationId,
            status: "OPEN",
          },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
          },
        }),
        ...(input.note?.trim()
          ? [
              prisma.message.create({
                data: {
                  conversationId: input.conversationId,
                  role: "HUMAN_AGENT",
                  content: input.note.trim(),
                  metadata: { action: "resolved" },
                },
              }),
            ]
          : []),
      ]);

      return conversation;
    } catch (error) {
      logger.warn({ error }, "Conversation resolve failed; falling back to runtime store");
      const conversation = runtimeStore.conversations.find((item) => item.id === input.conversationId);
      if (conversation) {
        conversation.status = "RESOLVED";
        conversation.updatedAt = resolvedAt;
      }

      runtimeStore.escalations
        .filter((item) => item.conversationId === input.conversationId && item.status === "OPEN")
        .forEach((item) => {
          item.status = "RESOLVED";
        });

      if (input.note?.trim()) {
        runtimeStore.messages.push({
          id: crypto.randomUUID(),
          conversationId: input.conversationId,
          role: "HUMAN_AGENT",
          content: input.note.trim(),
          metadata: { action: "resolved" },
          createdAt: resolvedAt,
        });
      }

      return { id: input.conversationId, status: "RESOLVED" as const };
    }
  }

  async addStaffReply(input: { conversationId: string; reply: string }) {
    const reply = input.reply.trim();
    if (!reply) {
      return { id: input.conversationId, status: "ESCALATED" as const };
    }

    if (runtimeFlags.shouldUseMockData) {
      const conversation = runtimeStore.conversations.find((item) => item.id === input.conversationId);
      if (conversation) {
        conversation.lastMessage = reply;
        conversation.updatedAt = new Date().toISOString();
      }

      runtimeStore.messages.push({
        id: crypto.randomUUID(),
        conversationId: input.conversationId,
        role: "HUMAN_AGENT",
        content: reply,
        metadata: { action: "staff_reply" },
        createdAt: new Date().toISOString(),
      });

      return { id: input.conversationId, status: "ESCALATED" as const };
    }

    try {
      const [conversation] = await prisma.$transaction([
        prisma.conversation.update({
          where: { id: input.conversationId },
          data: {
            summary: reply.slice(0, 240),
            updatedAt: new Date(),
          },
        }),
        prisma.message.create({
          data: {
            conversationId: input.conversationId,
            role: "HUMAN_AGENT",
            content: reply,
            metadata: { action: "staff_reply" },
          },
        }),
      ]);

      return conversation;
    } catch (error) {
      logger.warn({ error }, "Staff reply failed; falling back to runtime store");
      const conversation = runtimeStore.conversations.find((item) => item.id === input.conversationId);
      if (conversation) {
        conversation.lastMessage = reply;
        conversation.updatedAt = new Date().toISOString();
      }

      runtimeStore.messages.push({
        id: crypto.randomUUID(),
        conversationId: input.conversationId,
        role: "HUMAN_AGENT",
        content: reply,
        metadata: { action: "staff_reply" },
        createdAt: new Date().toISOString(),
      });

      return { id: input.conversationId, status: "ESCALATED" as const };
    }
  }

  async upsertConversation(input: {
    conversationId?: string;
    authorId?: string;
    authorName?: string | null;
    channel: Channel;
    externalThreadId?: string;
    message: string;
    intent?: QueryIntent;
    confidence?: number;
    escalated?: boolean;
  }) {
    if (runtimeFlags.shouldUseMockData) {
      const existing = input.conversationId
        ? runtimeStore.conversations.find((conversation) => conversation.id === input.conversationId)
        : undefined;

      if (existing) {
        existing.lastMessage = input.message;
        existing.intent = input.intent ?? existing.intent;
        existing.confidence = input.confidence ?? existing.confidence;
        existing.status = input.escalated ? "ESCALATED" : existing.status;
        existing.updatedAt = new Date().toISOString();
        return existing;
      }

      return makeConversation({
        authorName: input.authorName,
        channel: input.channel,
        status: input.escalated ? "ESCALATED" : "OPEN",
        lastMessage: input.message,
        confidence: input.confidence,
        intent: input.intent,
      });
    }

    try {
      if (input.conversationId) {
        return await prisma.conversation.update({
          where: { id: input.conversationId },
          data: {
            authorId: input.authorId,
            status: input.escalated ? "ESCALATED" : undefined,
            metadata: {
              externalThreadId: input.externalThreadId,
            },
          },
        });
      }

      return await prisma.conversation.create({
        data: {
          authorId: input.authorId,
          channel: input.channel,
          externalThreadId: input.externalThreadId,
          status: input.escalated ? "ESCALATED" : "OPEN",
          summary: input.message.slice(0, 240),
        },
      });
    } catch (error) {
      logger.warn({ error }, "Conversation write failed; falling back to runtime store");
      return makeConversation({
        authorName: input.authorName,
        channel: input.channel,
        status: input.escalated ? "ESCALATED" : "OPEN",
        lastMessage: input.message,
        confidence: input.confidence,
        intent: input.intent,
      });
    }
  }

  async addMessage(input: {
    conversationId: string;
    role: "USER" | "ASSISTANT" | "SYSTEM" | "HUMAN_AGENT";
    content: string;
    intent?: QueryIntent;
    aiConfidence?: number;
    metadata?: Record<string, unknown>;
  }) {
    if (runtimeFlags.shouldUseMockData) {
      runtimeStore.messages.push({
        id: crypto.randomUUID(),
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        intent: input.intent,
        aiConfidence: input.aiConfidence,
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    try {
      await prisma.message.create({
        data: {
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          intent: input.intent,
          aiConfidence: input.aiConfidence,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      logger.warn({ error }, "Message write failed; falling back to runtime store");
      runtimeStore.messages.push({
        id: crypto.randomUUID(),
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        intent: input.intent,
        aiConfidence: input.aiConfidence,
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
      });
    }
  }

  async listConversations(input: { cursor?: string; limit?: number; workQueueOnly?: boolean } = {}): Promise<ConversationSummary[]> {
    const limit = input.limit ?? 20;

    if (runtimeFlags.shouldUseMockData) {
      return runtimeStore.conversations
        .filter((conversation) => !input.workQueueOnly || conversation.status === "ESCALATED")
        .slice(0, limit);
    }

    try {
      const conversations = await prisma.conversation.findMany({
        where: input.workQueueOnly ? { status: "ESCALATED" } : undefined,
        orderBy: { updatedAt: "desc" },
        take: limit,
        include: {
          author: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      return conversations.map((conversation) => {
        const last = conversation.messages[0];
        return {
          id: conversation.id,
          authorName: conversation.author?.fullName,
          channel: conversation.channel,
          status: conversation.status,
          lastMessage: last?.content ?? conversation.summary ?? "",
          confidence: last?.aiConfidence,
          intent: last?.intent,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
        };
      });
    } catch (error) {
      logger.warn({ error }, "Conversation list failed; falling back to runtime store");
      return runtimeStore.conversations
        .filter((conversation) => !input.workQueueOnly || conversation.status === "ESCALATED")
        .slice(0, limit);
    }
  }

  async listConversationThreads(input: { limit?: number; workQueueOnly?: boolean; conversationId?: string } = {}): Promise<ConversationThread[]> {
    const limit = input.limit ?? 50;

    if (runtimeFlags.shouldUseMockData) {
      return runtimeStore.conversations
        .filter((conversation) => !input.conversationId || conversation.id === input.conversationId)
        .filter((conversation) => !input.workQueueOnly || conversation.status === "ESCALATED")
        .slice(0, limit)
        .map((conversation) => {
        const escalation = runtimeStore.escalations.find(
          (item) => item.conversationId === conversation.id,
        );

        return {
          ...conversation,
          messages: runtimeStore.messages
            .filter((message) => message.conversationId === conversation.id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((message) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              intent: message.intent,
              aiConfidence: message.aiConfidence,
              createdAt: message.createdAt,
            })),
          escalation: escalation
            ? {
                id: escalation.id,
                reason: escalation.reason,
                priority: escalation.priority,
                status: escalation.status,
                createdAt: escalation.createdAt,
              }
            : undefined,
        };
      });
    }

    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          ...(input.workQueueOnly ? { status: "ESCALATED" as const } : {}),
          ...(input.conversationId ? { id: input.conversationId } : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        include: {
          author: true,
          messages: {
            orderBy: { createdAt: "asc" },
          },
          escalations: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      return conversations.map((conversation) => {
      const last = conversation.messages[conversation.messages.length - 1];
      const escalation = conversation.escalations[0];

      return {
        id: conversation.id,
        authorName: conversation.author?.fullName,
        channel: conversation.channel,
        status: conversation.status,
        lastMessage: last?.content ?? conversation.summary ?? "",
        confidence: last?.aiConfidence,
        intent: last?.intent,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          intent: message.intent,
          aiConfidence: message.aiConfidence,
          createdAt: message.createdAt.toISOString(),
        })),
        escalation: escalation
          ? {
              id: escalation.id,
              reason: escalation.reason,
              priority: escalation.priority,
              status: escalation.status,
              createdAt: escalation.createdAt.toISOString(),
            }
          : undefined,
      };
      });
    } catch (error) {
      logger.warn({ error }, "Conversation thread list failed; falling back to runtime store");
      return runtimeStore.conversations
        .filter((conversation) => !input.conversationId || conversation.id === input.conversationId)
        .filter((conversation) => !input.workQueueOnly || conversation.status === "ESCALATED")
        .slice(0, limit)
        .map((conversation) => {
        const escalation = runtimeStore.escalations.find(
          (item) => item.conversationId === conversation.id,
        );

        return {
          ...conversation,
          messages: runtimeStore.messages
            .filter((message) => message.conversationId === conversation.id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((message) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              intent: message.intent,
              aiConfidence: message.aiConfidence,
              createdAt: message.createdAt,
            })),
          escalation: escalation
            ? {
                id: escalation.id,
                reason: escalation.reason,
                priority: escalation.priority,
                status: escalation.status,
                createdAt: escalation.createdAt,
              }
            : undefined,
        };
      });
    }
  }
}

export const conversationService = new ConversationService();
