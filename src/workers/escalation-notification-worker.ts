import { Worker } from "bullmq";
import Redis from "ioredis";
import { env, runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";

if (!runtimeFlags.hasRedis) {
  logger.warn("REDIS_URL is not configured; escalation notification worker is idle");
} else {
  const connection = new Redis(env.REDIS_URL!, { maxRetriesPerRequest: null });

  new Worker(
    "bookleaf.escalation-notifications",
    async (job) => {
      const payload = job.data as {
        escalationId: string;
        priority: string;
        reason: string;
      };

      if (!env.SUPPORT_QUEUE_WEBHOOK_URL) {
        logger.warn({ payload }, "SUPPORT_QUEUE_WEBHOOK_URL not configured; escalation logged only");
        return payload;
      }

      const response = await fetch(env.SUPPORT_QUEUE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Support queue webhook failed with ${response.status}`);
      }

      return payload;
    },
    { connection, concurrency: 5 },
  );

  logger.info("Escalation notification worker started");
}
