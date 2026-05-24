"use client";

import { Activity, Gauge, TimerReset, Workflow } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { formatPercent } from "@/lib/utils";
import { formatDuration } from "@/utils/format";

export function AnalyticsStrip() {
  const analytics = useChatStore((state) => state.analytics);
  const metrics = [
    {
      label: "Queries",
      value: analytics?.totalQueries.toLocaleString() ?? "0",
      icon: Activity,
    },
    {
      label: "Automation",
      value: formatPercent(analytics?.automationRate ?? 0),
      icon: Workflow,
    },
    {
      label: "Confidence",
      value: formatPercent(analytics?.averageConfidence ?? 0),
      icon: Gauge,
    },
    {
      label: "P95 latency",
      value: formatDuration(analytics?.p95LatencyMs ?? 0),
      icon: TimerReset,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.label} className="rounded-md border border-border bg-panel px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xl font-semibold tracking-normal">{metric.value}</div>
          </div>
        );
      })}
    </section>
  );
}
