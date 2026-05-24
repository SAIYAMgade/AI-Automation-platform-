import type { ChatRequest } from "@/types/api";
import type { Channel } from "@/types/domain";
import type { ChatAutomationResult } from "@/types/orchestrator";

export type InboundChannelMessage = {
  channel: Channel;
  externalThreadId?: string;
  text: string;
  identity: ChatRequest["identity"];
  metadata?: Record<string, unknown>;
};

export interface ChannelAdapter {
  channel: Channel;
  normalize(payload: unknown): Promise<InboundChannelMessage>;
  deliver(result: ChatAutomationResult): Promise<void>;
}
