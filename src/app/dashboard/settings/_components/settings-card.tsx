import type { ReactNode } from "react";

export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-sm font-semibold text-txt-primary">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-txt-secondary">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
