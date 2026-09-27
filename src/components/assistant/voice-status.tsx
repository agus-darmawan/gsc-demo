"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpeechToText } from "@/hooks/use-speech-to-text";
import { formatDuration } from "@/lib/format";

/** Listening / transcribing indicator above the composer. */
export function VoiceStatus({ stt }: { stt: SpeechToText }) {
  if (stt.state === "listening") {
    return (
      <div
        role="status"
        className="flex items-center gap-2 border border-red/40 bg-red/10 px-2 py-1.5"
      >
        <span
          className="status-dot shrink-0 bg-red motion-safe:animate-pulse-dot"
          aria-hidden
        />
        <span className="shrink-0 text-[11px] text-red">
          Mendengarkan {formatDuration(stt.elapsedS)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] text-txt-secondary italic">
          {stt.interim ||
            (stt.activeEngine === "server"
              ? "Merekam suara…"
              : "Silakan bicara…")}
        </span>
        <Button size="xs" variant="danger" onClick={stt.stop}>
          Selesai
        </Button>
        <button
          type="button"
          onClick={stt.cancel}
          aria-label="Batalkan input suara"
          className="text-txt-tertiary hover:text-txt-primary"
        >
          <X size={12} />
        </button>
      </div>
    );
  }
  if (stt.state === "processing") {
    return (
      <div
        role="status"
        className="flex items-center gap-2 px-1 text-[11px] text-txt-secondary"
      >
        <Loader2 size={12} className="animate-spin" aria-hidden />
        Mengubah suara menjadi teks…
      </div>
    );
  }
  if (stt.state === "error" && stt.error) {
    return <p className="px-1 text-[11px] text-amber">{stt.error}</p>;
  }
  return null;
}
