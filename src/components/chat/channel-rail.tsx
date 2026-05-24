"use client";

import type React from "react";
import { MessageCircle, Mail, AtSign, Smartphone, Blocks, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useChatStore } from "@/store/chat-store";
import type { Channel } from "@/types/domain";
import { cn } from "@/lib/utils";

const channels: Array<{ id: Channel; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "DASHBOARD", label: "Dashboard", icon: MessageCircle },
  { id: "EMAIL", label: "Email", icon: Mail },
  { id: "WHATSAPP", label: "WhatsApp", icon: Smartphone },
  { id: "INSTAGRAM", label: "Instagram", icon: AtSign },
  { id: "API", label: "API", icon: Blocks },
];

export function ChannelRail() {
  const { channel, setChannel, darkMode, toggleDarkMode } = useChatStore();

  return (
    <aside className="flex h-full w-full flex-row items-center justify-between border-b border-border bg-sidebar px-3 py-2 lg:w-20 lg:flex-col lg:border-b-0 lg:border-r lg:px-2 lg:py-4">
      <div className="flex items-center gap-2 lg:flex-col">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
          BL
        </div>
        <div className="hidden h-px w-10 bg-border lg:block" />
        {channels.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              aria-label={item.label}
              onClick={() => setChannel(item.id)}
              className={cn(
                "text-muted-foreground",
                channel === item.id && "bg-muted text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 lg:flex-col">
        {darkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
        <Switch checked={darkMode} onCheckedChange={toggleDarkMode} aria-label="Toggle dark mode" />
      </div>
    </aside>
  );
}
