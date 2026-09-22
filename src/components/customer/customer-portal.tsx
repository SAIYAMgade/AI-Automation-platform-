"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, Bot, Building2, LogOut, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OriginButton } from "@/components/ui/origin-button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/store/chat-store";
import { useChatStream } from "@/hooks/use-chat-stream";
import type { ConversationThread } from "@/types/domain";
import { cn } from "@/lib/utils";

type CustomerSession = {
  role: "customer";
  name: string;
  email?: string;
  phone?: string;
  instagramHandle?: string;
  bookTitle?: string;
};

const quickQuestions = [
  "When will my book publish?",
  "Is my ISBN generated?",
  "Where is my author copy?",
  "What is the cost of publishing with BookLeaf?",
  "Tell me about BookLeaf publishing services.",
];

export function CustomerPortal() {
  const router = useRouter();
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [draft, setDraft] = useState("");
  const { messages, isStreaming, telemetry, error, addMessage } = useChatStore();
  const { sendMessage } = useChatStream();

  useEffect(() => {
    const raw = window.localStorage.getItem("bookleaf_session");
    if (!raw) {
      router.replace("/login");
      return;
    }

    const parsed = JSON.parse(raw) as CustomerSession | { role?: string };
    if (parsed.role !== "customer") {
      router.replace("/login");
      return;
    }

    setSession(parsed as CustomerSession);
  }, [router]);

  const identity = useMemo(
    () => ({
      email: session?.email,
      phone: session?.phone,
      instagramHandle: session?.instagramHandle,
      displayName: session?.name,
    }),
    [session],
  );

  useEffect(() => {
    if (!telemetry.conversationId) return;

    let active = true;

    async function syncHumanReplies() {
      const response = await fetch(
        `/api/conversations?details=true&workQueue=false&limit=1&conversationId=${telemetry.conversationId}`,
        { cache: "no-store" },
      );
      if (!response.ok || !active) return;

      const payload = (await response.json()) as { data?: ConversationThread[] };
      const thread = payload.data?.[0];
      if (!thread) return;

      const existingIds = new Set(useChatStore.getState().messages.map((message) => message.id));
      thread.messages
        .filter((message) => message.role === "HUMAN_AGENT" && !existingIds.has(message.id))
        .forEach((message) => {
          addMessage({
            id: message.id,
            role: "human_agent",
            content: message.content,
            createdAt: message.createdAt,
          });
        });
    }

    syncHumanReplies().catch(() => undefined);
    const timer = window.setInterval(() => {
      syncHumanReplies().catch(() => undefined);
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [addMessage, telemetry.conversationId]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = draft.trim();
    if (!value || !session) return;
    setDraft("");
    await sendMessage(value, {
      channel: "DASHBOARD",
      identity,
      metadata: {
        portal: "customer",
        declaredBookTitle: session.bookTitle,
      },
      externalThreadId: `dashboard-${session.email ?? session.phone ?? session.name}`,
    });
  }

  function logout() {
    window.localStorage.removeItem("bookleaf_session");
    router.push("/login");
  }

  if (!session) {
    return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading customer portal...</main>;
  }

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[380px_1fr]">
      <aside className="border-r border-border bg-sidebar/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl font-semibold tracking-normal text-brand-ink">
            BookLeaf Publication
          </div>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8">
          <Badge variant="secondary">Customer portal</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-brand-ink">
            <span>Hi {session.name}</span>
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ask about your book, royalty, ISBN, copies, publishing timeline, or BookLeaf company services.
          </p>
        </div>

        <div className="mt-6 rounded-md border border-border bg-panel p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpenText className="h-4 w-4" />
            Account context
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Book</dt>
              <dd className="text-right">{session.bookTitle || "Not provided"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate text-right">{session.email || "Not provided"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Instagram</dt>
              <dd>{session.instagramHandle || "Not provided"}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 space-y-2">
          <div className="text-xs font-medium uppercase text-muted-foreground">Try a real query</div>
          {quickQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => setDraft(question)}
              className="w-full rounded-md border border-border bg-panel px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              {question}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-screen flex-col">
        <header className="border-b border-border bg-panel/95 px-5 py-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-brand-ink">BookLeaf AI support</h2>
                <Badge variant="outline">DASHBOARD</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Answers are grounded in author records and BookLeaf knowledge. Uncertain cases go to staff.
              </p>
            </div>
            {telemetry.intent && (
              <Badge variant={telemetry.requiresHuman ? "warning" : "success"}>
                {telemetry.requiresHuman ? "Sent to support" : `${telemetry.intent} · ${Math.round((telemetry.confidence ?? 0) * 100)}%`}
              </Badge>
            )}
          </div>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 p-5">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn("flex gap-3", message.role === "user" && "justify-end")}
                >
                  {message.role !== "user" && (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[82%] rounded-md border px-4 py-3 text-sm leading-6",
                      message.role === "user"
                        ? "border-primary bg-primary text-primary-foreground"
                        : message.role === "human_agent"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                        : "border-border bg-[#fff1f4]",
                    )}
                  >
                    {message.pending ? "Checking BookLeaf records and knowledge..." : message.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={submit} className="border-t border-border bg-panel p-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-3">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask BookLeaf about your book, cost, royalty, ISBN, copies, timeline, or services..."
              disabled={isStreaming}
            />
            <div className="flex justify-end">
              <OriginButton type="submit" disabled={isStreaming || draft.trim().length < 2}>
                <Send className="h-4 w-4" />
                Ask BookLeaf
              </OriginButton>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
