import { ingestRequestSchema } from "@/types/api";
import { ragIngestionService } from "@/rag/ingest-service";
import { enqueueDocumentIngestion } from "@/services/queue/queue";
import { runtimeFlags } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/api/response";
import { corsHeaders, optionsResponse } from "@/lib/security/cors";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { requireStaffSession } from "@/lib/auth/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(`ingest:${getClientIp(request)}`);
    await requireStaffSession();
    const body = ingestRequestSchema.parse(await request.json());

    if (body.async && runtimeFlags.hasRedis) {
      const job = await enqueueDocumentIngestion(body);
      return jsonOk(
        {
          mode: "queued",
          jobId: job?.id,
          documentCount: body.documents.length,
        },
        { status: 202, headers: corsHeaders },
      );
    }

    const result = await ragIngestionService.ingestDocuments(body.documents);
    return jsonOk({ mode: "completed", result }, { headers: corsHeaders });
  } catch (error) {
    return jsonError(error);
  }
}
