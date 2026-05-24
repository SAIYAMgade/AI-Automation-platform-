import { chatRequestSchema } from "@/types/api";
import { queryOrchestrator } from "@/services/query-orchestrator";
import { createSseResponse, jsonError, jsonOk } from "@/lib/api/response";
import { streamWords } from "@/lib/api/stream";
import { corsHeaders, optionsResponse } from "@/lib/security/cors";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import type { ChatAutomationResult } from "@/types/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(`chat:${getClientIp(request)}`);
    const body = chatRequestSchema.parse(await request.json());
    const result = await queryOrchestrator.handle(body);

    if (!body.stream) {
      return jsonOk(result, { headers: corsHeaders });
    }

    return createSseResponse(chatEvents(result));
  } catch (error) {
    return jsonError(error);
  }
}

async function* chatEvents(result: ChatAutomationResult) {
  yield {
    event: "metadata",
    data: {
      requestId: result.requestId,
      conversationId: result.conversationId,
      intent: result.intent,
      confidence: result.confidence,
      requiresHuman: result.requiresHuman,
      escalation: result.escalation,
      author: result.author,
      latencyMs: result.latencyMs,
      retrievedDocuments: result.retrievedDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        category: document.category,
        similarity: document.similarity,
      })),
    },
  };

  for await (const token of streamWords(result.response)) {
    yield {
      event: "token",
      data: { token },
    };
  }

  yield {
    event: "done",
    data: {
      response: result.response,
    },
  };
}
