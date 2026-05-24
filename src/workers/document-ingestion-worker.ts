import { Worker } from "bullmq";
import Redis from "ioredis";
import { env, runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import { ragIngestionService } from "@/rag/ingest-service";
import { ingestRequestSchema } from "@/types/api";

if (!runtimeFlags.hasRedis) {
  logger.warn("REDIS_URL is not configured; document ingestion worker is idle");
} else {
  const connection = new Redis(env.REDIS_URL!, { maxRetriesPerRequest: null });

  new Worker(
    "bookleaf.document-ingestion",
    async (job) => {
      const payload = ingestRequestSchema.parse(job.data);
      return ragIngestionService.ingestDocuments(payload.documents);
    },
    { connection, concurrency: 3 },
  );

  logger.info("Document ingestion worker started");
}
