import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  ariaLabel: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn("flex border border-border bg-gcs-primary", className)}
    >
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(v)}
            className={cn(
              "flex h-7 flex-1 items-center justify-center gap-1.5 px-2 font-mono text-[10px] font-semibold transition-colors",
              active
                ? "bg-cyan/15 text-cyan"
                : "text-txt-tertiary hover:text-txt-secondary",
            )}
          >
            {Icon && <Icon size={11} aria-hidden />}
            {label}
          </button>
        );
      })}
    </fieldset>
  );
}
