import { DashboardAdapter } from "@/services/channels/dashboard-adapter";
import { EmailAdapter } from "@/services/channels/email-adapter";
import { InstagramAdapter } from "@/services/channels/instagram-adapter";
import { WhatsAppAdapter } from "@/services/channels/whatsapp-adapter";
import type { Channel } from "@/types/domain";

export const channelAdapters = {
  DASHBOARD: new DashboardAdapter(),
  EMAIL: new EmailAdapter(),
  WHATSAPP: new WhatsAppAdapter(),
  INSTAGRAM: new InstagramAdapter(),
} satisfies Partial<Record<Channel, unknown>>;
