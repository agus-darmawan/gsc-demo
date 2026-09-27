import { Loader2, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "warning"
  | "success";
export type ButtonSize = "xs" | "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border-cyan/60 bg-cyan/15 text-cyan hover:bg-cyan/25",
  secondary:
    "border-border bg-gcs-elevated text-txt-secondary hover:text-txt-primary hover:border-border-strong",
  ghost:
    "border-transparent text-txt-tertiary hover:text-txt-primary hover:bg-gcs-elevated",
  danger: "border-red/50 bg-red/10 text-red hover:bg-red/20",
  warning: "border-amber/50 bg-amber/10 text-amber hover:bg-amber/20",
  success: "border-green/50 bg-green/10 text-green hover:bg-green/20",
};

const SIZE: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-[10px] gap-1",
  sm: "h-7 px-2.5 text-[11px] gap-1.5",
  md: "h-9 px-4 text-xs gap-2",
};

const ICON_SIZE: Record<ButtonSize, number> = { xs: 11, sm: 12, md: 14 };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  size = "sm",
  icon: Icon,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap border font-mono font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={ICON_SIZE[size]} className="animate-spin" />
      ) : (
        Icon && <Icon size={ICON_SIZE[size]} aria-hidden />
      )}
      {children}
    </button>
  );
}

export interface IconButtonProps
  extends Omit<ButtonProps, "children" | "icon"> {
  icon: LucideIcon;
  /** Required: icon-only buttons need an accessible name. */
  label: string;
}

export function IconButton({
  icon,
  label,
  size = "sm",
  className,
  ...rest
}: IconButtonProps) {
  const square: Record<ButtonSize, string> = {
    xs: "w-6 px-0",
    sm: "w-7 px-0",
    md: "w-9 px-0",
  };
  return (
    <Button
      icon={icon}
      size={size}
      aria-label={label}
      title={label}
      className={cn(square[size], className)}
      {...rest}
    />
  );
}
