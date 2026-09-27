import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-start gap-3 text-left disabled:opacity-50"
    >
      <span
        className={cn(
          "relative mt-0.5 h-4 w-7 shrink-0 border transition-colors",
          checked
            ? "border-cyan/60 bg-cyan/20"
            : "border-border bg-gcs-primary",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-2.5 w-2.5 transition-all",
            checked ? "left-[14px] bg-cyan" : "left-0.5 bg-txt-tertiary",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-txt-primary">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-snug text-txt-tertiary">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}
