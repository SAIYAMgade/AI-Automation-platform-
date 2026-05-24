"use client";

import { Inbox, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/store/chat-store";

export function ConversationList() {
  const conversations = useChatStore((state) => state.conversations);

  return (
    <aside className="hidden min-h-0 border-r border-border bg-panel xl:flex xl:w-80 xl:flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Support queue</h2>
            <p className="mt-1 text-xs text-muted-foreground">Unified author conversations</p>
          </div>
          <Badge variant="outline">{conversations.length || 2} live</Badge>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search author, book, intent" />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className="w-full rounded-md px-3 py-3 text-left transition-colors hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {conversation.authorName ?? "Unknown author"}
                </span>
                <Badge
                  variant={conversation.status === "ESCALATED" ? "warning" : "secondary"}
                  className="shrink-0"
                >
                  {conversation.channel}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {conversation.lastMessage}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Inbox className="h-3.5 w-3.5" />
                {conversation.intent ?? "UNKNOWN"} · {Math.round((conversation.confidence ?? 0.8) * 100)}%
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
