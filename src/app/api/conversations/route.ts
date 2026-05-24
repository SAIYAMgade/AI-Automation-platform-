import { conversationService } from "@/services/conversation-service";
import { jsonError, jsonOk } from "@/lib/api/response";
import { corsHeaders, optionsResponse } from "@/lib/security/cors";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { requireStaffSession } from "@/lib/auth/supabase-server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  try {
    await enforceRateLimit(`conversations:${getClientIp(request)}`);
    await requireStaffSession();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const details = url.searchParams.get("details") === "true";
    const workQueueOnly = url.searchParams.get("workQueue") !== "false";
    const conversationId = url.searchParams.get("conversationId") ?? undefined;
    const conversations = details
      ? await conversationService.listConversationThreads({ limit, workQueueOnly, conversationId })
      : await conversationService.listConversations({ limit, workQueueOnly });
    return jsonOk(conversations, { headers: corsHeaders });
  } catch (error) {
    return jsonError(error);
  }
}

const updateConversationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("RESOLVE"),
    conversationId: z.string().uuid(),
    note: z.string().max(1000).optional(),
  }),
  z.object({
    action: z.literal("REPLY"),
    conversationId: z.string().uuid(),
    reply: z.string().trim().min(1).max(2000),
  }),
  z.object({
    action: z.undefined().optional(),
    conversationId: z.string().uuid(),
    status: z.literal("RESOLVED"),
    note: z.string().max(1000).optional(),
  }),
]);

export async function PATCH(request: Request) {
  try {
    await enforceRateLimit(`conversations:update:${getClientIp(request)}`);
    await requireStaffSession();
    const body = updateConversationSchema.parse(await request.json());

    if (body.action === "REPLY") {
      const conversation = await conversationService.addStaffReply({
        conversationId: body.conversationId,
        reply: body.reply,
      });

      return jsonOk(conversation, { headers: corsHeaders });
    }

    const conversation = await conversationService.resolveConversation({
      conversationId: body.conversationId,
      note: body.note,
    });

    return jsonOk(conversation, { headers: corsHeaders });
  } catch (error) {
    return jsonError(error);
  }
}
