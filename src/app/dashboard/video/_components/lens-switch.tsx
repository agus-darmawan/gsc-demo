"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useDroneStore } from "@/stores/use-drone-store";
import type { CameraLens } from "@/types/command";

const LENSES: { value: CameraLens; label: string }[] = [
  { value: "rgb", label: "RGB" },
  { value: "thermal", label: "Termal" },
  { value: "split", label: "Split" },
];

/** Camera lens control for bridges that support it (DJI M4T via MSDK). */
export function LensSwitch({ droneId }: { droneId: string }) {
  const supported = useDroneStore(
    (s) => s.live[droneId]?.capabilities.includes("lens") ?? false,
  );
  const [lens, setLens] = useState<CameraLens | null>(null);
  const [busy, setBusy] = useState(false);
  if (!supported) return null;

  const change = async (value: CameraLens) => {
    setBusy(true);
    try {
      const ack = await api.vehicle.send(droneId, {
        type: "set-lens",
        lens: value,
      });
      if (ack.accepted) setLens(value);
      else toast.warning("Lensa tidak diganti", ack.message);
    } catch (error) {
      toast.error("Gagal mengganti lensa", errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset className="flex border border-border-subtle" disabled={busy}>
      <legend className="sr-only">Lensa kamera</legend>
      {LENSES.map((l) => (
        <button
          key={l.value}
          type="button"
          aria-pressed={lens === l.value}
          onClick={() => change(l.value)}
          className={cn(
            "px-1.5 py-0.5 font-mono text-[10px] disabled:opacity-50",
            lens === l.value
              ? "bg-cyan/15 text-cyan"
              : "text-txt-tertiary hover:text-txt-primary",
          )}
        >
          {l.label}
        </button>
      ))}
    </fieldset>
  );
}
