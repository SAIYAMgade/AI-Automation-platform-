import { createEmbeddingModel } from "@/ai/clients";

const EMBEDDING_DIMENSIONS = 1536;

export async function embedText(text: string) {
  const embeddingModel = createEmbeddingModel();
  if (embeddingModel) {
    return embeddingModel.embedQuery(text);
  }

  return hashEmbedding(text);
}

export async function embedDocuments(texts: string[]) {
  const embeddingModel = createEmbeddingModel();
  if (embeddingModel) {
    return embeddingModel.embedDocuments(texts);
  }

  return texts.map(hashEmbedding);
}

export function hashEmbedding(text: string) {
  const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const tokens = normalized.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    let hash = 2166136261;
    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    const position = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    vector[position] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let aMag = 0;
  let bMag = 0;

  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    aMag += a[index] * a[index];
    bMag += b[index] * b[index];
  }

  return dot / ((Math.sqrt(aMag) || 1) * (Math.sqrt(bMag) || 1));
}
