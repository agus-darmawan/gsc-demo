import type { ReactNode } from "react";

/** Titled group inside the drone form. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border-subtle px-4 py-4">
      <div>
        <h3 className="text-xs font-semibold text-txt-primary">{title}</h3>
        {description && (
          <p className="mt-0.5 text-[11px] leading-snug text-txt-tertiary">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
