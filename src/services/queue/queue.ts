import { Queue } from "bullmq";
import Redis from "ioredis";
import { env, runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { EscalationPriority } from "@/types/domain";

const connection = runtimeFlags.hasRedis
  ? new Redis(env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
    })
  : null;

const documentQueue = connection
  ? new Queue("bookleaf.document-ingestion", { connection })
  : null;

const escalationQueue = connection
  ? new Queue("bookleaf.escalation-notifications", { connection })
  : null;

export async function enqueueDocumentIngestion(payload: unknown) {
  if (!documentQueue) {
    logger.info({ payload }, "Redis not configured; document ingestion will run synchronously");
    return null;
  }

  return documentQueue.add("ingest", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 250,
    removeOnFail: 500,
  });
}

export async function enqueueEscalationNotification(payload: {
  escalationId: string;
  priority: EscalationPriority;
  reason: string;
}) {
  if (!escalationQueue) {
    logger.warn({ payload }, "Redis not configured; escalation notification logged only");
    return null;
  }

  return escalationQueue.add("notify-support", payload, {
    priority: payload.priority === "URGENT" ? 1 : payload.priority === "HIGH" ? 2 : 5,
    attempts: 5,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  });
}
