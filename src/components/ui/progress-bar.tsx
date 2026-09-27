import { cn } from "@/lib/utils";

const TONE = {
  cyan: "bg-cyan",
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
} as const;

export function ProgressBar({
  value,
  tone = "cyan",
  className,
  label,
}: {
  value: number;
  tone?: keyof typeof TONE;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1 w-full bg-gcs-elevated", className)}
    >
      <div
        className={cn("h-full transition-[width] duration-200", TONE[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
