import type { ChannelAdapter, InboundChannelMessage } from "@/services/channels/channel-adapter";
import { chatRequestSchema } from "@/types/api";
import { logger } from "@/lib/logger";
import type { ChatAutomationResult } from "@/types/orchestrator";

export class DashboardAdapter implements ChannelAdapter {
  channel = "DASHBOARD" as const;

  async normalize(payload: unknown): Promise<InboundChannelMessage> {
    const parsed = chatRequestSchema.parse(payload);
    return {
      channel: parsed.channel,
      externalThreadId: parsed.externalThreadId,
      text: parsed.query,
      identity: parsed.identity,
      metadata: parsed.metadata,
    };
  }

  async deliver(result: ChatAutomationResult) {
    logger.debug({ requestId: result.requestId }, "Dashboard delivery handled by streaming API response");
  }
}
