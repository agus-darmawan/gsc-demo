"use client";

import type { RealtimeStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/use-app-store";

const STATUS: Record<
  RealtimeStatus,
  { label: string; dot: string; title: string }
> = {
  open: { label: "Terhubung", dot: "bg-green", title: "Kanal realtime aktif" },
  connecting: {
    label: "Menyambung",
    dot: "bg-amber motion-safe:animate-pulse-dot",
    title: "Menyambung ke server realtime",
  },
  closed: {
    label: "Terputus",
    dot: "bg-red",
    title: "Kanal realtime terputus, mencoba lagi",
  },
};

export function RealtimeIndicator() {
  const status = useAppStore((s) => s.realtime);
  const s = STATUS[status];
  return (
    <div
      title={s.title}
      className="flex h-8 items-center gap-1.5 border border-border-subtle px-2"
    >
      <span className={cn("status-dot", s.dot)} aria-hidden />
      <span className="text-[11px] text-txt-secondary">{s.label}</span>
    </div>
  );
}
