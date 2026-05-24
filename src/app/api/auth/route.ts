import { z } from "zod";
import { authService } from "@/services/auth-service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { corsHeaders, optionsResponse } from "@/lib/security/cors";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const authSchema = z.object({
  mode: z.enum(["sign-in", "sign-up"]),
  role: z.enum(["customer", "company"]),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(`auth:${getClientIp(request)}`);
    const body = authSchema.parse(await request.json());
    const session = body.mode === "sign-up"
      ? await authService.signUp(body)
      : await authService.signIn(body);

    return jsonOk(session, { headers: corsHeaders });
  } catch (error) {
    return jsonError(error);
  }
}
