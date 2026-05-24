import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { runtimeStore } from "@/db/runtime-store";
import { runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import { enqueueEscalationNotification } from "@/services/queue/queue";
import type { EscalationPriority } from "@/types/domain";

export class EscalationService {
  async create(input: {
    conversationId?: string;
    authorId?: string;
    reason: string;
    priority?: EscalationPriority;
    payload?: Record<string, unknown>;
  }) {
    const priority = input.priority ?? "MEDIUM";

    if (runtimeFlags.shouldUseMockData) {
      const escalation = {
        id: randomUUID(),
        conversationId: input.conversationId,
        authorId: input.authorId,
        reason: input.reason,
        priority,
        status: "OPEN" as const,
        payload: input.payload ?? {},
        createdAt: new Date().toISOString(),
      };
      runtimeStore.escalations.unshift(escalation);

      await enqueueEscalationNotification({
        escalationId: escalation.id,
        priority,
        reason: input.reason,
      });

      return escalation;
    }

    let escalation;
    try {
      escalation = await prisma.escalation.create({
        data: {
          conversationId: input.conversationId,
          authorId: input.authorId,
          reason: input.reason,
          priority,
          payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      logger.warn({ error }, "Escalation database write failed; falling back to runtime store");
      escalation = {
        id: randomUUID(),
        conversationId: input.conversationId,
        authorId: input.authorId,
        reason: input.reason,
        priority,
        status: "OPEN" as const,
        payload: input.payload ?? {},
        createdAt: new Date().toISOString(),
      };
      runtimeStore.escalations.unshift(escalation);
    }

    await enqueueEscalationNotification({
      escalationId: escalation.id,
      priority,
      reason: input.reason,
    });

    return escalation;
  }

  async listOpen(input: { limit?: number } = {}) {
    const limit = input.limit ?? 50;

    if (runtimeFlags.shouldUseMockData) {
      return runtimeStore.escalations
        .filter((escalation) => escalation.status === "OPEN")
        .slice(0, limit);
    }

    try {
      return await prisma.escalation.findMany({
        where: { status: "OPEN" },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: limit,
        include: {
          author: true,
          conversation: true,
        },
      });
    } catch (error) {
      logger.warn({ error }, "Escalation list failed; falling back to runtime store");
      return runtimeStore.escalations
        .filter((escalation) => escalation.status === "OPEN")
        .slice(0, limit);
    }
  }
}

export const escalationService = new EscalationService();
