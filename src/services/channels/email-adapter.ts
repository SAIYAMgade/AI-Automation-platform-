import { z } from "zod";
import type { ChannelAdapter, InboundChannelMessage } from "@/services/channels/channel-adapter";
import type { ChatAutomationResult } from "@/types/orchestrator";
import { logger } from "@/lib/logger";

const emailPayloadSchema = z.object({
  messageId: z.string(),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
  subject: z.string().optional(),
  bodyText: z.string(),
});

export class EmailAdapter implements ChannelAdapter {
  channel = "EMAIL" as const;

  async normalize(payload: unknown): Promise<InboundChannelMessage> {
    const parsed = emailPayloadSchema.parse(payload);
    return {
      channel: "EMAIL",
      externalThreadId: parsed.messageId,
      text: `${parsed.subject ?? ""}\n${parsed.bodyText}`.trim(),
      identity: {
        email: parsed.fromEmail,
        displayName: parsed.fromName,
        externalId: parsed.messageId,
      },
      metadata: { source: "gmail_api" },
    };
  }

  async deliver(result: ChatAutomationResult) {
    logger.info({ requestId: result.requestId }, "Email response ready for outbound email provider");
  }
}
