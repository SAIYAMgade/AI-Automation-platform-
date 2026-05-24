"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  AtSign,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  DatabaseZap,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  RefreshCcw,
  Smartphone,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDuration } from "@/utils/format";
import { formatPercent } from "@/lib/utils";
import type { Channel, ConversationThread } from "@/types/domain";
import type { AnalyticsOverview } from "@/store/chat-store";
import { cn } from "@/lib/utils";

const channelFilters: Array<{
  id: Channel | "ALL";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "ALL", label: "All", icon: Inbox },
  { id: "DASHBOARD", label: "Dashboard", icon: MessageCircle },
  { id: "EMAIL", label: "Email", icon: Mail },
  { id: "WHATSAPP", label: "WhatsApp", icon: Smartphone },
  { id: "INSTAGRAM", label: "Instagram", icon: AtSign },
];

export function CompanyDashboard() {
  const router = useRouter();
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview>({
    totalQueries: 0,
    automationRate: 0,
    escalations: 0,
    averageConfidence: 0,
    p95LatencyMs: 0,
    intentBreakdown: [],
  });
  const [selectedChannel, setSelectedChannel] = useState<Channel | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [staffReply, setStaffReply] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("bookleaf_session");
    if (!raw) {
      router.replace("/login");
      return;
    }

    const parsed = JSON.parse(raw) as { role?: string };
    if (parsed.role !== "company") {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    async function load() {
      const [conversationResponse, analyticsResponse] = await Promise.all([
        fetch("/api/conversations?details=true&limit=100&workQueue=true", { cache: "no-store" }),
        fetch("/api/analytics", { cache: "no-store" }),
      ]);

      if (!active) return;

      if (conversationResponse.ok) {
        const payload = await conversationResponse.json();
        const nextThreads = payload.data as ConversationThread[];
        setThreads(nextThreads);
        setSelectedId((current) => current ?? nextThreads[0]?.id ?? null);
      }

      if (analyticsResponse.ok) {
        const payload = await analyticsResponse.json();
        setAnalytics(payload.data);
      }

      setLastRefresh(new Date().toLocaleTimeString());
    }

    load().catch(() => undefined);
    const timer = window.setInterval(() => {
      load().catch(() => undefined);
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredThreads = useMemo(
    () =>
      selectedChannel === "ALL"
        ? threads
        : threads.filter((thread) => thread.channel === selectedChannel),
    [selectedChannel, threads],
  );

  const selectedThread =
    filteredThreads.find((thread) => thread.id === selectedId) ?? filteredThreads[0] ?? null;

  useEffect(() => {
    setStaffReply("");
    setActionError(null);
  }, [selectedThread?.id]);

  const channelCounts = useMemo(() => {
    return channelFilters.reduce<Record<string, number>>((acc, channel) => {
      acc[channel.id] =
        channel.id === "ALL"
          ? threads.length
          : threads.filter((thread) => thread.channel === channel.id).length;
      return acc;
    }, {});
  }, [threads]);

  function logout() {
    window.localStorage.removeItem("bookleaf_session");
    router.push("/login");
  }

  async function resolveSelectedThread() {
    if (!selectedThread || selectedThread.status === "RESOLVED") return;

    setResolvingId(selectedThread.id);
    setActionError(null);

    try {
      const response = await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedThread.id,
          action: "RESOLVE",
          note: staffReply.trim() ? `Resolved after staff reply: ${staffReply.trim()}` : "Marked solved by company staff.",
        }),
      });

      if (!response.ok) {
        throw new Error("Could not mark this query as solved.");
      }

      setThreads((current) =>
        current.filter((thread) => thread.id !== selectedThread.id),
      );
      setAnalytics((current) => ({
        ...current,
        totalQueries: Math.max(0, current.totalQueries - 1),
        escalations: Math.max(0, current.escalations - 1),
      }));
      setSelectedId((current) => (current === selectedThread.id ? null : current));
      setStaffReply("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not mark this query as solved.");
    } finally {
      setResolvingId(null);
    }
  }

  async function replyToSelectedThread() {
    if (!selectedThread || selectedThread.status === "RESOLVED" || !staffReply.trim()) return;

    const reply = staffReply.trim();
    const sentAt = new Date().toISOString();
    setReplyingId(selectedThread.id);
    setActionError(null);

    try {
      const response = await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPLY",
          conversationId: selectedThread.id,
          reply,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not send the staff reply.");
      }

      setThreads((current) =>
        current.map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...thread,
                lastMessage: reply,
                updatedAt: sentAt,
                messages: [
                  ...thread.messages,
                  {
                    id: crypto.randomUUID(),
                    role: "HUMAN_AGENT",
                    content: reply,
                    createdAt: sentAt,
                  },
                ],
              }
            : thread,
        ),
      );
      setStaffReply("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not send the staff reply.");
    } finally {
      setReplyingId(null);
    }
  }

  return (
    <main className="grid h-screen min-h-screen grid-cols-[88px_360px_1fr] overflow-hidden bg-background text-foreground">
      <aside className="flex flex-col items-center justify-between border-r border-border bg-sidebar/80 px-3 py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-11 w-11 place-items-center bg-primary text-2xl font-light text-primary-foreground shadow-sm">
            /
          </div>
          <Separator />
          {channelFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedChannel(filter.id)}
                className={cn(
                  "group relative grid h-11 w-11 place-items-center rounded-md text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-primary/10 hover:text-primary hover:shadow-sm",
                  selectedChannel === filter.id && "bg-primary/10 text-primary shadow-sm",
                )}
                aria-label={filter.label}
                title={filter.label}
              >
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                {channelCounts[filter.id] > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {channelCounts[filter.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </aside>

      <aside className="flex min-h-0 flex-col border-r border-border bg-panel/95">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="mb-5 text-2xl font-semibold tracking-normal text-brand-ink">
                BookLeaf Publication
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h1 className="font-semibold text-brand-ink">Company dashboard</h1>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Live channel inbox, no seeded tickets.</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Refresh" onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Queries" value={analytics.totalQueries.toString()} />
            <Metric label="Automation" value={formatPercent(analytics.automationRate)} />
            <Metric label="Confidence" value={formatPercent(analytics.averageConfidence)} />
            <Metric label="P95 latency" value={formatDuration(analytics.p95LatencyMs)} />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Realtime polling every 2s · last refresh {lastRefresh || "pending"}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2 p-3">
            {filteredThreads.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                No human-review queries yet. Normal AI answers stay automated; only unclear or unsupported customer questions appear here.
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedId(thread.id)}
                  className={cn(
                    "w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-muted",
                    selectedThread?.id === thread.id && "border-primary bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{thread.authorName ?? "Unknown author"}</span>
                    <Badge variant={thread.status === "ESCALATED" ? "warning" : "secondary"}>
                      {thread.channel}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{thread.lastMessage}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Badge variant="outline">{thread.intent ?? "UNKNOWN"}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((thread.confidence ?? 0) * 100)}%
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      <section className="grid min-h-0 grid-cols-[1fr_360px]">
        <div className="flex min-h-0 flex-col">
          <header className="border-b border-border bg-background px-5 py-4">
            {selectedThread ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{selectedThread.authorName ?? "Unknown author"}</h2>
                    <Badge variant="outline">{selectedThread.channel}</Badge>
                    {selectedThread.status === "ESCALATED" && (
                      <Badge variant="warning">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Human needed
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Intent {selectedThread.intent ?? "UNKNOWN"} · confidence{" "}
                    {Math.round((selectedThread.confidence ?? 0) * 100)}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedThread.status !== "RESOLVED" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={resolveSelectedThread}
                      disabled={resolvingId === selectedThread.id}
                    >
                      {resolvingId === selectedThread.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Mark solved
                    </Button>
                  )}
                  <Badge variant={selectedThread.status === "ESCALATED" ? "warning" : "success"}>
                    {selectedThread.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold">No conversation selected</h2>
                <p className="mt-1 text-sm text-muted-foreground">Human-review customer questions will appear here.</p>
              </div>
            )}
          </header>

          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto flex max-w-4xl flex-col gap-4 p-5">
              {!selectedThread ? (
                <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Waiting for an unclear or unsupported customer question that needs human support.
                </div>
              ) : (
                selectedThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex gap-3", message.role === "USER" && "justify-end")}
                  >
                    {message.role !== "USER" && (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] rounded-md border px-4 py-3 text-sm leading-6",
                        message.role === "USER"
                          ? "border-primary bg-primary text-primary-foreground"
                          : message.role === "HUMAN_AGENT"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                          : "border-border bg-[#fff1f4]",
                      )}
                    >
                      {message.content}
                    </div>
                    {message.role === "USER" && (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                        <UserRound className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <aside className="min-h-0 border-l border-border bg-panel">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Automation health
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">Automation rate</span>
                      <span>{formatPercent(analytics.automationRate)}</span>
                    </div>
                    <Progress value={Math.min(Math.max(analytics.automationRate * 100, 0), 100)} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">Average confidence</span>
                      <span>{formatPercent(analytics.averageConfidence)}</span>
                    </div>
                    <Progress value={Math.min(Math.max(analytics.averageConfidence * 100, 0), 100)} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Reply and resolve
                </div>
                {selectedThread ? (
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={staffReply}
                      onChange={(event) => setStaffReply(event.target.value)}
                      placeholder="Write the reply that staff will send to this customer..."
                      className="min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                      disabled={selectedThread.status === "RESOLVED" || resolvingId === selectedThread.id || replyingId === selectedThread.id}
                    />
                    {actionError && (
                      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        {actionError}
                      </p>
                    )}
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      onClick={replyToSelectedThread}
                      disabled={!staffReply.trim() || selectedThread.status === "RESOLVED" || resolvingId === selectedThread.id || replyingId === selectedThread.id}
                    >
                      {replyingId === selectedThread.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      Send staff reply
                    </Button>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={resolveSelectedThread}
                      disabled={selectedThread.status === "RESOLVED" || resolvingId === selectedThread.id || replyingId === selectedThread.id}
                    >
                      {resolvingId === selectedThread.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {selectedThread.status === "RESOLVED" ? "Already solved" : "Solve customer query"}
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Select a customer query to solve it.</p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Escalation state
                </div>
                {selectedThread?.escalation ? (
                  <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                    <div className="font-medium">{selectedThread.escalation.priority} priority</div>
                    <p className="mt-2 text-xs leading-5">{selectedThread.escalation.reason}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No open escalation for the selected conversation.
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DatabaseZap className="h-4 w-4 text-muted-foreground" />
                  Intent breakdown
                </div>
                <div className="mt-3 space-y-2">
                  {analytics.intentBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classified queries yet.</p>
                  ) : (
                    analytics.intentBreakdown.map((item) => (
                      <div key={item.intent} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                        <span>{item.intent}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
