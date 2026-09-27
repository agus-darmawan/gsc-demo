import { cn } from "@/lib/utils";

/** Marks a simulated drone. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      title="Drone demo (simulasi) — fitur demo"
      className={cn(
        "shrink-0 border border-violet/50 bg-violet/15 px-1 font-mono text-[9px] font-bold tracking-wider text-violet-light",
        className,
      )}
    >
      DEMO
    </span>
  );
}
