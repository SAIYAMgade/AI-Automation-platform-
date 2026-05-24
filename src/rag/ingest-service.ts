import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { mockKnowledgeChunks } from "@/db/mock-data";
import { embedDocuments } from "@/ai/embeddings";
import { chunkDocument } from "@/rag/chunker";
import { env, runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { ingestDocumentSchema } from "@/types/api";
import type { z } from "zod";

type IngestDocument = z.infer<typeof ingestDocumentSchema>;

export class RagIngestionService {
  async ingestDocuments(documents: IngestDocument[]) {
    const results = [];

    for (const document of documents) {
      const checksum = createHash("sha256")
        .update(`${document.title}:${document.source}:${document.content}`)
        .digest("hex");
      const chunks = await chunkDocument(document.content);
      const embeddings = await embedDocuments(chunks.map((chunk) => chunk.content));

      if (runtimeFlags.shouldUseMockData) {
        chunks.forEach((chunk, index) => {
          mockKnowledgeChunks.push({
            id: `runtime-${checksum}-${index}`,
            documentId: `runtime-${checksum}`,
            title: document.title,
            category: document.category,
            content: chunk.content,
            similarity: 0.82,
            metadata: { ...document.metadata, chunkIndex: index },
          });
        });
        results.push({ title: document.title, chunks: chunks.length, mode: "memory" });
        continue;
      }

      const savedDocument = await prisma.knowledgeDocument.upsert({
        where: { checksum },
        update: {
          title: document.title,
          source: document.source,
          category: document.category,
          metadata: document.metadata as Prisma.InputJsonValue,
        },
        create: {
          title: document.title,
          source: document.source,
          category: document.category,
          checksum,
          metadata: document.metadata as Prisma.InputJsonValue,
        },
      });

      await prisma.knowledgeChunk.deleteMany({
        where: { documentId: savedDocument.id },
      });

      for (const [index, chunk] of chunks.entries()) {
        const savedChunk = await prisma.knowledgeChunk.create({
          data: {
            documentId: savedDocument.id,
            content: chunk.content,
            tokenCount: chunk.tokenEstimate,
            embeddingModel: env.OPENAI_EMBEDDING_MODEL,
            metadata: {
              ...document.metadata,
              chunkIndex: index,
            } as Prisma.InputJsonValue,
          },
        });

        await prisma.$executeRawUnsafe(
          "update knowledge_chunks set embedding = $1::vector where id = $2::uuid",
          vectorLiteral(embeddings[index]),
          savedChunk.id,
        );
      }

      results.push({ title: document.title, chunks: chunks.length, mode: "database" });
    }

    logger.info({ documents: results }, "Knowledge documents ingested");
    return results;
  }
}

function vectorLiteral(vector: number[]) {
  return `[${vector.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

export const ragIngestionService = new RagIngestionService();
