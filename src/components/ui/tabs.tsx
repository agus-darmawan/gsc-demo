import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: readonly TabItem<T>[];
  ariaLabel: string;
  className?: string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  ariaLabel,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex gap-1 border-b border-border-subtle", className)}
    >
      {items.map(({ value: v, label, icon: Icon, count }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs transition-colors",
              active
                ? "border-cyan text-txt-primary"
                : "border-transparent text-txt-tertiary hover:text-txt-secondary",
            )}
          >
            {Icon && <Icon size={13} aria-hidden />}
            {label}
            {count !== undefined && (
              <span className="font-mono text-[10px] text-txt-muted">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
