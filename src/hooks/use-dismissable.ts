"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

/** Open state for popovers: closes on outside click and Escape. */
export function useDismissable<T extends HTMLElement>(): {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  ref: RefObject<T | null>;
} {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, toggle: () => setOpen((o) => !o), ref };
}
