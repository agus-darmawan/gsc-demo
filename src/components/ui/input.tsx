import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const BASE =
  "w-full border bg-gcs-primary px-2 font-mono text-xs text-txt-primary placeholder:text-txt-muted transition-colors focus:border-cyan/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

interface InvalidProp {
  invalid?: boolean;
}

export function TextInput({
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & InvalidProp) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        BASE,
        "h-8",
        invalid ? "border-red/60" : "border-border",
        className,
      )}
      {...rest}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & InvalidProp) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        BASE,
        "min-h-16 resize-y py-1.5 leading-relaxed",
        invalid ? "border-red/60" : "border-border",
        className,
      )}
      {...rest}
    />
  );
}
