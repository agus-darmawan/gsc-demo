"use client";

import { Bot, Copy, Loader2, Mic, RotateCcw, User } from "lucide-react";
import { formatClock } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { FrameSnapshot, VlmMessage } from "@/types/assistant";

export function SnapshotMeta({ snapshot }: { snapshot: FrameSnapshot }) {
  const count = snapshot.detections?.detections.length;
  return (
    <span className="font-mono text-[9px] text-txt-muted">
      Frame {formatClock(snapshot.takenAt)}
      {count != null && `, ${count} deteksi`}
      {snapshot.caption && ", dengan deskripsi"}
    </span>
  );
}

/** Operator message: right-aligned, cyan, "Anda". */
function UserMessage({ message }: { message: VlmMessage }) {
  return (
    <div className="flex max-w-[92%] gap-2 self-end">
      <div className="flex min-w-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 text-[10px]">
          {message.inputMode === "voice" && (
            <span
              className="flex items-center gap-0.5 text-txt-tertiary"
              title="Diketik lewat suara"
            >
              <Mic size={10} aria-hidden />
              suara
            </span>
          )}
          <span className="font-mono text-txt-muted">
            {formatClock(message.timestamp)}
          </span>
          <span className="font-semibold text-cyan">Anda</span>
        </div>
        {message.snapshot && (
          <div className="flex flex-col items-end gap-0.5">
            {/* biome-ignore lint/performance/noImgElement: data URL snapshot, nothing to optimize */}
            <img
              src={message.snapshot.image}
              alt="Frame yang dikirim ke asisten"
              className="aspect-video w-48 border border-border-subtle object-cover"
            />
            <SnapshotMeta snapshot={message.snapshot} />
          </div>
        )}
        <div className="border border-cyan/40 bg-cyan/10 px-2.5 py-1.5 text-xs leading-relaxed whitespace-pre-wrap text-txt-primary">
          {message.text}
        </div>
      </div>
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center border border-cyan/50 bg-cyan/15"
        aria-hidden
      >
        <User size={13} className="text-cyan" />
      </span>
    </div>
  );
}

/** Assistant message: left-aligned, violet, "Asisten AI". */
function AssistantMessage({
  message,
  onRetry,
}: {
  message: VlmMessage;
  onRetry?: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      toast.success("Jawaban disalin");
    } catch {
      toast.error("Tidak bisa menyalin ke clipboard");
    }
  };

  return (
    <div className="flex max-w-[92%] gap-2 self-start">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center border border-violet/50 bg-violet/15"
        aria-hidden
      >
        <Bot size={13} className="text-violet-light" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="font-semibold text-violet-light">Asisten AI</span>
          <span className="font-mono text-txt-muted">
            {formatClock(message.timestamp)}
          </span>
        </div>
        <div
          className={cn(
            "border px-2.5 py-1.5 text-xs leading-relaxed whitespace-pre-wrap",
            message.error
              ? "border-red/40 bg-red/10 text-red"
              : "border-violet/30 bg-gcs-secondary text-txt-primary",
          )}
        >
          {message.pending ? (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-txt-muted">
              <Loader2 size={11} className="animate-spin" aria-hidden />
              Menganalisis frame…
            </span>
          ) : (
            message.text
          )}
        </div>
        {!message.pending && (
          <div className="flex gap-2">
            {message.error && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 text-[10px] text-txt-tertiary hover:text-cyan"
              >
                <RotateCcw size={10} aria-hidden />
                Kirim ulang
              </button>
            ) : (
              !message.error && (
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-1 text-[10px] text-txt-muted hover:text-txt-secondary"
                >
                  <Copy size={10} aria-hidden />
                  Salin
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function VlmMessageBubble({
  message,
  onRetry,
}: {
  message: VlmMessage;
  onRetry?: () => void;
}) {
  return message.role === "user" ? (
    <UserMessage message={message} />
  ) : (
    <AssistantMessage message={message} onRetry={onRetry} />
  );
}
