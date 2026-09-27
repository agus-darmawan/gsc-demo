import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin text-txt-tertiary", className)}
      aria-hidden
    />
  );
}

/** Full-area placeholder while a view loads. */
export function ViewLoading({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="grid-overlay flex flex-1 items-center justify-center gap-2 font-mono text-[11px] text-txt-tertiary">
      <Spinner />
      {label}
    </div>
  );
}
