"use client";

import { AlertCircle, BookOpenText, DatabaseZap, Route, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EscalationBadge } from "@/components/chat/escalation-badge";
import { useChatStore } from "@/store/chat-store";
import { formatPercent } from "@/lib/utils";
import { formatDuration } from "@/utils/format";

export function TelemetryPanel() {
  const telemetry = useChatStore((state) => state.telemetry);
  const docs = telemetry.retrievedDocuments ?? [];

  return (
    <aside className="hidden min-h-0 border-l border-border bg-panel 2xl:flex 2xl:w-96 2xl:flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">AI telemetry</h2>
            <p className="mt-1 text-xs text-muted-foreground">Grounding, confidence, and escalation state</p>
          </div>
          <EscalationBadge requiresHuman={telemetry.requiresHuman} />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          <div className="rounded-md border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Route className="h-4 w-4 text-muted-foreground" />
              Detected intent
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant="outline">{telemetry.intent ?? "WAITING"}</Badge>
              <span className="text-xs text-muted-foreground">
                {telemetry.latencyMs ? formatDuration(telemetry.latencyMs) : "idle"}
              </span>
            </div>
          </div>

          <div className="rounded-md border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Confidence score
            </div>
            <Progress className="mt-3" value={(telemetry.confidence ?? 0) * 100} />
            <div className="mt-2 text-xs text-muted-foreground">
              {formatPercent(telemetry.confidence ?? 0)} threshold-aware confidence
            </div>
          </div>

          {telemetry.escalation && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                Escalation ticket
              </div>
              <p className="mt-2 text-xs leading-5">{telemetry.escalation.reason}</p>
              <Badge className="mt-3" variant="warning">
                {telemetry.escalation.priority}
              </Badge>
            </div>
          )}

          <div className="rounded-md border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DatabaseZap className="h-4 w-4 text-muted-foreground" />
              Retrieved knowledge
            </div>
            <div className="mt-3 space-y-2">
              {docs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No retrieval run yet.</p>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="rounded-md border border-border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">{doc.title}</span>
                      <Badge variant="secondary">{Math.round(doc.similarity * 100)}%</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpenText className="h-3 w-3" />
                      {doc.category}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
