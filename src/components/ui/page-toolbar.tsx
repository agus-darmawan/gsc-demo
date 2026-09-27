import type { ReactNode } from "react";

interface PageToolbarProps {
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
}

/** Title row for administration pages with actions on the right. */
export function PageToolbar({ title, meta, children }: PageToolbarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle bg-gcs-primary px-4">
      <h1 className="text-sm font-semibold text-txt-primary">{title}</h1>
      {meta && (
        <span className="font-mono text-[11px] text-txt-tertiary">{meta}</span>
      )}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}
