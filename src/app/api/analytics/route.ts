import { analyticsService } from "@/services/analytics-service";
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
    await enforceRateLimit(`analytics:${getClientIp(request)}`);
    await requireStaffSession();
    const overview = await analyticsService.getOverview();
    return jsonOk(overview, { headers: corsHeaders });
  } catch (error) {
    return jsonError(error);
  }
}
