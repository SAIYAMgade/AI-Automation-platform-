import { mkdir, appendFile } from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { runtimeStore } from "@/db/runtime-store";
import { runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { Channel, QueryIntent } from "@/types/domain";

export class SupportLogService {
  async record(input: {
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
    metadata?: Record<string, unknown>;
  }) {
    if (runtimeFlags.shouldUseMockData) {
      const createdAt = new Date().toISOString();
      runtimeStore.supportLogs.unshift({
        ...input,
        createdAt,
      });
      await appendSupportLogFile({ ...input, createdAt });
      return;
    }

    try {
      await prisma.supportLog.create({
        data: {
          requestId: input.requestId,
          conversationId: input.conversationId,
          authorId: input.authorId,
          channel: input.channel,
          userQuery: input.userQuery,
          aiResponse: input.aiResponse,
          intent: input.intent,
          confidence: input.confidence,
          retrievedDocumentIds: input.retrievedDocumentIds,
          latencyMs: input.latencyMs,
          failureReason: input.failureReason,
          requiresHuman: input.requiresHuman,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      const createdAt = new Date().toISOString();
      logger.warn({ error }, "Support log database write failed; falling back to local file");
      runtimeStore.supportLogs.unshift({
        ...input,
        createdAt,
      });
      await appendSupportLogFile({ ...input, createdAt, persistenceFallback: "file" });
    }
  }
}

async function appendSupportLogFile(payload: Record<string, unknown>) {
  try {
    const logsDir = path.join(process.cwd(), "logs");
    await mkdir(logsDir, { recursive: true });
    await appendFile(
      path.join(logsDir, "support-events.jsonl"),
      `${JSON.stringify(payload)}\n`,
      "utf8",
    );
  } catch (error) {
    logger.warn({ error }, "Failed to append support event log file");
  }
}

export const supportLogService = new SupportLogService();
