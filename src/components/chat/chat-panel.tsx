"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CornerDownLeft, Loader2, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStream } from "@/hooks/use-chat-stream";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const [draft, setDraft] = useState("");
  const { sendMessage } = useChatStream();
  const { messages, isStreaming, error, channel } = useChatStore();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = draft;
    setDraft("");
    await sendMessage(value);
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="border-b border-border px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">BookLeaf AI Query Console</h1>
              <Badge variant="secondary">{channel}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Intent detection, Supabase lookup, RAG grounding, and escalation in one operator view.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isStreaming && <Loader2 className="h-4 w-4 animate-spin" />}
            {isStreaming ? "AI is composing" : "Automation online"}
          </div>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 lg:px-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role !== "user" && (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[82%] rounded-md border px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "user"
                      ? "border-primary bg-primary text-primary-foreground"
                      : message.role === "system"
                        ? "border-border bg-panel text-muted-foreground"
                        : "border-border bg-[#fff1f4]",
                  )}
                >
                  {message.pending ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking BookLeaf systems
                    </span>
                  ) : (
                    message.content
                  )}
                </div>
                {message.role === "user" && (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                    <UserRound className="h-4 w-4" />
                  </div>
                )}
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

      <form onSubmit={onSubmit} className="border-t border-border bg-panel p-3 lg:p-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about book status, royalties, author copies, ISBN, PR package, dashboard access..."
            className="min-h-24"
            disabled={isStreaming}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CornerDownLeft className="h-3.5 w-3.5" />
              Ctrl Enter sends
            </div>
            <Button type="submit" disabled={isStreaming || draft.trim().length < 2}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
