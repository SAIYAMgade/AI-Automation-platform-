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

export async function GET(request: Request) {
  try {
    await enforceRateLimit(`escalations:${getClientIp(request)}`);
    await requireStaffSession();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const escalations = await escalationService.listOpen({ limit });
    return jsonOk(escalations, { headers: corsHeaders });
  } catch (error) {
    return jsonError(error);
  }
}
