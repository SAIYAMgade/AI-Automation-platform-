import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { env, runtimeFlags } from "@/lib/env";

export function createChatModel(options: { temperature?: number; streaming?: boolean } = {}) {
  if (!runtimeFlags.hasOpenAI) return null;

  return new ChatOpenAI({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    temperature: options.temperature ?? 0,
    streaming: options.streaming ?? false,
    timeout: 20_000,
    maxRetries: 2,
  });
}

export function createEmbeddingModel() {
  if (!runtimeFlags.hasOpenAI) return null;

  return new OpenAIEmbeddings({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_EMBEDDING_MODEL,
    timeout: 20_000,
    maxRetries: 2,
  });
}
