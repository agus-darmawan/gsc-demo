"use client";

import { BellOff, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useEventStore } from "@/stores/use-event-store";
import { SEVERITY_STYLE } from "./severity";

const VISIBLE = 80;

export function EventDrawer({ onClose }: { onClose: () => void }) {
  const events = useEventStore((s) => s.events);
  const markAllRead = useEventStore((s) => s.markAllRead);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-mark as read when new events arrive while open
  useEffect(() => {
    markAllRead();
  }, [markAllRead, events.length]);

  return (
    <aside
      aria-label="Kejadian terbaru"
      className="panel fixed top-12 right-0 bottom-6 z-40 flex w-[380px] max-w-[92vw] flex-col shadow-2xl shadow-black/60 motion-safe:animate-slide-in"
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5">
        <h2 className="text-sm font-semibold">Kejadian terbaru</h2>
        <span className="font-mono text-[10px] text-txt-tertiary">
          {events.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="ml-auto text-txt-tertiary hover:text-txt-primary"
        >
          <X size={14} />
        </button>
      </div>

      <ol className="flex-1 overflow-y-auto">
        {events.length === 0 && (
          <EmptyState icon={BellOff} title="Belum ada kejadian" />
        )}
        {events.slice(0, VISIBLE).map((event) => {
          const style = SEVERITY_STYLE[event.severity];
          const Icon = style.icon;
          return (
            <li
              key={event.id}
              className={cn(
                "flex gap-2.5 border-b border-l-2 border-b-border-subtle px-3 py-2",
                style.border,
              )}
            >
              <Icon
                size={13}
                className={cn("mt-0.5 shrink-0", style.text)}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug text-txt-primary">
                  {event.message}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-txt-muted">
                  {formatClock(event.timestamp)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <Link
        href="/dashboard/logs"
        onClick={onClose}
        className="border-t border-border-subtle px-3 py-2 text-center text-xs text-cyan hover:bg-gcs-elevated"
      >
        Buka log lengkap
      </Link>
    </aside>
  );
}
