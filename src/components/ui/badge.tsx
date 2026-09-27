import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "violet";

const TONE: Record<BadgeTone, string> = {
  neutral: "border-border bg-gcs-elevated text-txt-secondary",
  info: "border-cyan/30 bg-cyan/10 text-cyan",
  success: "border-green/30 bg-green/10 text-green",
  warning: "border-amber/30 bg-amber/10 text-amber",
  danger: "border-red/30 bg-red/10 text-red",
  violet: "border-violet/40 bg-violet/10 text-violet-light",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap border px-1.5 py-px font-mono text-[10px] font-semibold",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
