"use client";

import { Sparkles } from "lucide-react";
import { formatClock } from "@/lib/format";
import type { Caption } from "@/types/stream";

/** Live scene description (Moondream) under the video. */
export function CaptionFeed({ captions }: { captions: Caption[] }) {
  const [latest, ...previous] = captions;

  return (
    <div className="shrink-0 border-t border-border-subtle bg-gcs-primary px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5">
        <Sparkles size={11} className="text-violet" aria-hidden />
        <span className="label">Deskripsi adegan</span>
        {latest && (
          <span className="ml-auto font-mono text-[10px] tabular-nums text-txt-muted">
            {formatClock(latest.timestamp)}
          </span>
        )}
      </div>
      {latest ? (
        <p
          key={latest.timestamp}
          className="text-sm leading-snug text-txt-primary motion-safe:animate-fade-in"
        >
          {latest.text}
        </p>
      ) : (
        <p className="font-mono text-[10px] text-txt-muted">
          Menunggu deskripsi adegan…
        </p>
      )}
      {previous.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer font-mono text-[10px] text-txt-muted hover:text-txt-secondary">
            Sebelumnya ({previous.length})
          </summary>
          <ul className="mt-1 flex max-h-24 flex-col gap-1 overflow-y-auto">
            {previous.map((c) => (
              <li
                key={c.timestamp}
                className="flex gap-2 text-xs text-txt-tertiary"
              >
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-txt-muted">
                  {formatClock(c.timestamp)}
                </span>
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
