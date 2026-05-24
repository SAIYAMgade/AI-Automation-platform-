import { z } from "zod";
import type { ChannelAdapter, InboundChannelMessage } from "@/services/channels/channel-adapter";
import type { ChatAutomationResult } from "@/types/orchestrator";
import { logger } from "@/lib/logger";

const instagramPayloadSchema = z.object({
  dmId: z.string(),
  handle: z.string(),
  displayName: z.string().optional(),
  text: z.string(),
});

export class InstagramAdapter implements ChannelAdapter {
  channel = "INSTAGRAM" as const;

  async normalize(payload: unknown): Promise<InboundChannelMessage> {
    const parsed = instagramPayloadSchema.parse(payload);
    return {
      channel: "INSTAGRAM",
      externalThreadId: parsed.dmId,
      text: parsed.text,
      identity: {
        instagramHandle: parsed.handle,
        displayName: parsed.displayName,
        externalId: parsed.dmId,
      },
      metadata: { source: "instagram_webhooks" },
    };
  }

  async deliver(result: ChatAutomationResult) {
    logger.info({ requestId: result.requestId }, "Instagram response ready for Meta webhook reply");
  }
}
