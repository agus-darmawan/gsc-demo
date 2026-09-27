import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T extends string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  invalid?: boolean;
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  invalid,
  className,
  ...rest
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const next = options.find((o) => o.value === e.target.value);
        if (next) onChange(next.value);
      }}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-8 w-full border bg-gcs-primary px-1.5 font-mono text-xs text-txt-primary focus:border-cyan/60 focus:outline-none disabled:opacity-50",
        invalid ? "border-red/60" : "border-border",
        className,
      )}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
