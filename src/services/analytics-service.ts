import { prisma } from "@/db/prisma";
import { runtimeStore } from "@/db/runtime-store";
import { runtimeFlags } from "@/lib/env";
import { logger } from "@/lib/logger";
import { QUERY_INTENTS } from "@/types/domain";

export class AnalyticsService {
  async getOverview() {
    if (runtimeFlags.shouldUseMockData) {
      return runtimeAnalytics();
    }

    try {
      const [totalQueries, escalations, logs] = await Promise.all([
        prisma.conversation.count({ where: { status: "ESCALATED" } }),
        prisma.escalation.count({ where: { status: "OPEN" } }),
        prisma.supportLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 500,
          select: {
            confidence: true,
            latencyMs: true,
            intent: true,
            requiresHuman: true,
          },
        }),
      ]);

      const averageConfidence =
        logs.reduce((sum, log) => sum + log.confidence, 0) / Math.max(logs.length, 1);
      const latencies = logs.map((log) => log.latencyMs).sort((a, b) => a - b);
      const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
      const automated = logs.filter((log) => !log.requiresHuman).length;

      return {
        totalQueries,
        automationRate: automated / Math.max(logs.length, 1),
        escalations,
        averageConfidence,
        p95LatencyMs,
        intentBreakdown: QUERY_INTENTS.map((intent) => ({
          intent,
          count: logs.filter((log) => log.intent === intent).length,
        })).filter((item) => item.count > 0),
      };
    } catch (error) {
      logger.warn({ error }, "Analytics database read failed; falling back to runtime store");
      return runtimeAnalytics();
    }
  }
}

function runtimeAnalytics() {
  const logs = runtimeStore.supportLogs;
  const total = runtimeStore.conversations.filter(
    (conversation) => conversation.status === "ESCALATED",
  ).length;
  const escalations = runtimeStore.escalations.filter(
    (escalation) => escalation.status === "OPEN",
  ).length;
  const averageConfidence =
    logs.length > 0
      ? logs.reduce((sum, log) => sum + log.confidence, 0) / logs.length
      : 0;
  const latencies = logs.map((log) => log.latencyMs).sort((a, b) => a - b);
  const p95LatencyMs = latencies[Math.max(0, Math.ceil(latencies.length * 0.95) - 1)] ?? 0;
  const automated = logs.filter((log) => !log.requiresHuman).length;

  return {
    totalQueries: total,
    automationRate: logs.length > 0 ? automated / logs.length : 0,
    escalations,
    averageConfidence,
    p95LatencyMs,
    intentBreakdown: QUERY_INTENTS.map((intent) => ({
      intent,
      count: logs.filter((log) => log.intent === intent).length,
    })).filter((item) => item.count > 0),
  };
}

export const analyticsService = new AnalyticsService();
