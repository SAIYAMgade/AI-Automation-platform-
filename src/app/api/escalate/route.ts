import { escalationRequestSchema } from "@/types/api";
import { escalationService } from "@/services/escalation-service";
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
    await enforceRateLimit(`escalate:${getClientIp(request)}`);
    await requireStaffSession();
    const body = escalationRequestSchema.parse(await request.json());
    const escalation = await escalationService.create(body);
    return jsonOk(escalation, { status: 201, headers: corsHeaders });
  } catch (error) {
    return jsonError(error);
  }
}
