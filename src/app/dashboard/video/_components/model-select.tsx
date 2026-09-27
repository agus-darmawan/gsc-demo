"use client";

import { Check, ChevronDown, Loader2, ScanEye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/stores/use-model-store";
import { useStreamStore } from "@/stores/use-stream-store";
import type { Stream } from "@/types/stream";

const MAX_MODELS = 6;

/** Several detection models can run together on one stream (multi-detector). */
export function ModelSelect({ stream }: { stream: Stream }) {
  const models = useModelStore((s) => s.models);
  const updateStream = useStreamStore((s) => s.updateStream);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(
    () =>
      models.filter(
        (m) => m.status === "loaded" || stream.modelIds.includes(m.id),
      ),
    [models, stream.modelIds],
  );
  const active = options.filter((m) => stream.modelIds.includes(m.id));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = async (modelId: string) => {
    const next = stream.modelIds.includes(modelId)
      ? stream.modelIds.filter((id) => id !== modelId)
      : [...stream.modelIds, modelId];
    if (next.length > MAX_MODELS) {
      toast.warning(`Maksimal ${MAX_MODELS} model per stream`);
      return;
    }
    setBusy(true);
    try {
      updateStream(await api.streams.setModels(stream.id, next));
    } catch (error) {
      toast.error("Gagal mengganti model", errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const label =
    active.length === 0
      ? "Tanpa deteksi"
      : active.length === 1
        ? (active[0]?.name ?? "")
        : `${active.length} model`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={busy || !stream.online}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex max-w-44 items-center gap-1 border bg-gcs-overlay px-1.5 py-0.5 font-mono text-[10px] outline-none disabled:opacity-50",
          active.length > 0
            ? "border-violet/60 text-violet-light"
            : "border-border-subtle text-txt-secondary",
        )}
      >
        {busy ? (
          <Loader2 size={11} className="shrink-0 animate-spin" aria-hidden />
        ) : (
          <ScanEye size={11} className="shrink-0" aria-hidden />
        )}
        <span className="truncate">{label}</span>
        <ChevronDown size={10} className="shrink-0" aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute right-0 top-full z-30 mt-1 w-56 border border-border-default bg-gcs-elevated py-1 shadow-lg"
        >
          {options.length === 0 && (
            <p className="px-2.5 py-2 text-[11px] text-txt-muted">
              Belum ada model yang dimuat. Muat model di halaman Model AI.
            </p>
          )}
          {options.map((m) => {
            const selected = stream.modelIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={busy}
                onClick={() => toggle(m.id)}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-txt-secondary hover:bg-gcs-hover disabled:opacity-50"
              >
                <span
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center border",
                    selected
                      ? "border-violet bg-violet/30"
                      : "border-border-default",
                  )}
                >
                  {selected && <Check size={10} aria-hidden />}
                </span>
                <span
                  className="size-2 shrink-0"
                  style={{ backgroundColor: m.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                <span className="font-mono text-[9px] text-txt-muted">
                  {m.key}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
