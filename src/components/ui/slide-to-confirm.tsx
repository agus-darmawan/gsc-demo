"use client";

import { ChevronsRight, X } from "lucide-react";
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "warning" | "danger";

const TONE: Record<Tone, { track: string; knob: string; fill: string }> = {
  primary: {
    track: "border-cyan/50",
    knob: "bg-cyan text-gcs-root",
    fill: "bg-cyan/15",
  },
  warning: {
    track: "border-amber/50",
    knob: "bg-amber text-gcs-root",
    fill: "bg-amber/15",
  },
  danger: {
    track: "border-red/50",
    knob: "bg-red text-gcs-root",
    fill: "bg-red/15",
  },
};

const KNOB = 40;
const CONFIRM_AT = 0.92;

interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: Tone;
  disabled?: boolean;
}

/**
 * Critical vehicle actions require a deliberate slide (QGroundControl style)
 * instead of a single click. Keyboard: Arrow Right to advance, Esc to cancel.
 */
export function SlideToConfirm({
  label,
  onConfirm,
  onCancel,
  tone = "primary",
  disabled,
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const maxOffset = useCallback(
    () => Math.max(1, (trackRef.current?.clientWidth ?? 0) - KNOB),
    [],
  );

  const finish = useCallback(
    (value: number) => {
      if (value >= maxOffset() * CONFIRM_AT) {
        setOffset(maxOffset());
        onConfirm();
      } else {
        setOffset(0);
      }
    },
    [maxOffset, onConfirm],
  );

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startOffset: offset };
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const next = drag.startOffset + (e.clientX - drag.startX);
    setOffset(Math.max(0, Math.min(maxOffset(), next)));
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    finish(offset);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = Math.min(maxOffset(), offset + maxOffset() * 0.25);
    setOffset(next);
    if (next >= maxOffset() * CONFIRM_AT) finish(next);
  };

  const t = TONE[tone];
  const progress = offset / maxOffset();

  return (
    <div className="flex items-center gap-2">
      <div
        ref={trackRef}
        className={cn(
          "relative h-10 w-[340px] max-w-[70vw] select-none overflow-hidden border bg-gcs-overlay backdrop-blur",
          t.track,
          disabled && "opacity-50",
        )}
      >
        <div
          className={cn("absolute inset-y-0 left-0", t.fill)}
          style={{ width: offset + KNOB }}
        />
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center pl-10 pr-3 text-center text-xs text-txt-primary"
          style={{ opacity: 1 - progress * 0.8 }}
        >
          {label}
        </span>
        <button
          type="button"
          aria-label={`Geser untuk konfirmasi: ${label}`}
          disabled={disabled}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className={cn(
            "absolute top-0 flex h-10 touch-none items-center justify-center",
            t.knob,
            !dragging && "transition-[left] duration-200",
          )}
          style={{ left: offset, width: KNOB }}
        >
          <ChevronsRight size={18} />
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Batalkan"
        title="Batalkan (Esc)"
        className="flex h-10 w-10 items-center justify-center border border-border bg-gcs-overlay text-txt-tertiary backdrop-blur hover:text-txt-primary"
      >
        <X size={16} />
      </button>
    </div>
  );
}
