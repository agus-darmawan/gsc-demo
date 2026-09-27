"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Modal built on the native <dialog> element (focus trap + Esc for free). */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={cn(
        "m-auto w-[min(440px,92vw)] border border-border bg-gcs-secondary p-0 text-txt-primary",
        "backdrop:bg-gcs-root/75 backdrop:backdrop-blur-[2px]",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start gap-3 border-b border-border-subtle px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-sm font-semibold">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-xs leading-relaxed text-txt-secondary">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="p-0.5 text-txt-tertiary hover:text-txt-primary"
            >
              <X size={14} />
            </button>
          </div>
          {children && (
            <div className="overflow-y-auto px-4 py-3">{children}</div>
          )}
          {footer && (
            <div className="flex justify-end gap-2 border-t border-border-subtle px-4 py-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
