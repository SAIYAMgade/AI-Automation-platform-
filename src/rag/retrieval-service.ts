import { createHash } from "crypto";
import { embedText, hashEmbedding, cosineSimilarity } from "@/ai/embeddings";
import { getSupabaseAdmin } from "@/db/supabase";
import { mockKnowledgeChunks } from "@/db/mock-data";
import { env, runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import { cache } from "@/services/cache/cache";
import type { RetrievedKnowledgeChunk } from "@/types/domain";

export class RetrievalService {
  async retrieve(query: string, topK = 5): Promise<RetrievedKnowledgeChunk[]> {
    const cacheKey = `rag:${createHash("sha256").update(query).digest("hex")}:${topK}`;
    const cached = await cache.getJson<RetrievedKnowledgeChunk[]>(cacheKey);
    if (cached) return cached;

    const embedding = await embedText(query);

    if (runtimeFlags.hasSupabaseAdmin && !runtimeFlags.shouldUseMockData) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.rpc("match_knowledge_chunks", {
          query_embedding: embedding,
          match_count: topK,
          similarity_threshold: env.RAG_SIMILARITY_THRESHOLD,
        });

        if (error) throw error;

        const chunks = ((data ?? []) as Array<{
          id: string;
          document_id: string;
          title: string;
          category: string;
          content: string;
          similarity: number;
          metadata?: Record<string, unknown>;
        }>).map((row) => ({
          id: row.id,
          documentId: row.document_id,
          title: row.title,
          category: row.category,
          content: row.content,
          similarity: row.similarity,
          metadata: row.metadata,
        }));

        await cache.setJson(cacheKey, chunks, 120);
        return chunks;
      } catch (error) {
        logger.warn({ error }, "Supabase vector retrieval failed; falling back to local retrieval");
      }
    }

    const scored = mockKnowledgeChunks
      .map((chunk) => {
        const semantic = cosineSimilarity(embedding, hashEmbedding(chunk.content));
        const keywordBoost = keywordOverlap(query, `${chunk.title} ${chunk.category} ${chunk.content}`) * 0.08;
        return {
          ...chunk,
          similarity: Math.min(0.99, semantic + keywordBoost + chunk.similarity * 0.05),
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    await cache.setJson(cacheKey, scored, 60);
    return scored;
  }
}

function keywordOverlap(query: string, candidate: string) {
  const queryTokens = new Set(query.toLowerCase().split(/\W+/).filter((token) => token.length > 3));
  const candidateTokens = new Set(candidate.toLowerCase().split(/\W+/).filter((token) => token.length > 3));
  let matches = 0;
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) matches += 1;
  }
  return matches;
}

export const retrievalService = new RetrievalService();
