import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint / error, consistently spaced. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-0.5 text-red">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="font-mono text-[10px] text-red">
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-[11px] leading-snug text-txt-tertiary">{hint}</p>
        )
      )}
    </div>
  );
}
