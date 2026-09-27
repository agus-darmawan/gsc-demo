"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
  OctagonAlert,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  type Toast,
  type ToastTone,
  useEventStore,
} from "@/stores/use-event-store";

const TONE: Record<
  ToastTone,
  { icon: LucideIcon; className: string; ttl: number }
> = {
  info: { icon: Info, className: "border-cyan/40 text-cyan", ttl: 4_000 },
  success: {
    icon: CheckCircle2,
    className: "border-green/40 text-green",
    ttl: 4_000,
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber/50 text-amber",
    ttl: 7_000,
  },
  error: {
    icon: OctagonAlert,
    className: "border-red/60 text-red",
    ttl: 9_000,
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useEventStore((s) => s.dismiss);
  const tone = TONE[toast.tone];
  const Icon = tone.icon;

  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), tone.ttl);
    return () => clearTimeout(id);
  }, [dismiss, toast.id, tone.ttl]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "hud-panel pointer-events-auto flex w-80 items-start gap-2.5 border-l-2 px-3 py-2.5 motion-safe:animate-slide-in",
        tone.className,
      )}
    >
      <Icon size={14} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug text-txt-primary">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-[11px] leading-snug text-txt-secondary">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Tutup notifikasi"
        className="text-txt-tertiary hover:text-txt-primary"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useEventStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-3 bottom-9 z-50 flex flex-col items-end gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
