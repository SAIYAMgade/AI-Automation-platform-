import { z } from "zod";
import type { ChannelAdapter, InboundChannelMessage } from "@/services/channels/channel-adapter";
import type { ChatAutomationResult } from "@/types/orchestrator";
import { logger } from "@/lib/logger";

const whatsAppPayloadSchema = z.object({
  waMessageId: z.string(),
  phone: z.string(),
  profileName: z.string().optional(),
  text: z.string(),
});

export class WhatsAppAdapter implements ChannelAdapter {
  channel = "WHATSAPP" as const;

  async normalize(payload: unknown): Promise<InboundChannelMessage> {
    const parsed = whatsAppPayloadSchema.parse(payload);
    return {
      channel: "WHATSAPP",
      externalThreadId: parsed.waMessageId,
      text: parsed.text,
      identity: {
        phone: parsed.phone,
        displayName: parsed.profileName,
        externalId: parsed.waMessageId,
      },
      metadata: { source: "whatsapp_business_api" },
    };
  }

  async deliver(result: ChatAutomationResult) {
    logger.info({ requestId: result.requestId }, "WhatsApp response ready for provider handoff");
  }
}
