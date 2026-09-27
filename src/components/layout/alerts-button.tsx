"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { EventDrawer } from "@/components/events/event-drawer";
import { cn } from "@/lib/utils";
import { useEventStore } from "@/stores/use-event-store";

export function AlertsButton() {
  const unread = useEventStore((s) => s.unread);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={
          unread > 0 ? `Kejadian, ${unread} belum dibaca` : "Kejadian"
        }
        className={cn(
          "relative flex h-8 w-8 items-center justify-center border",
          open
            ? "border-cyan/40 text-cyan"
            : "border-border-subtle text-txt-tertiary hover:text-txt-primary",
        )}
      >
        <Bell size={14} aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 bg-red px-1 font-mono text-[9px] leading-4 font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && <EventDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
