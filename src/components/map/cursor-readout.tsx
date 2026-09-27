"use client";

import { useEffect, useState } from "react";
import { formatLatLon } from "@/lib/geo";
import { toMgrs } from "@/lib/mgrs";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { LatLon } from "@/types/geo";
import { useMapContext } from "./map-context";

/** Live coordinates under the mouse pointer. */
export function CursorReadout({ className }: { className?: string }) {
  const { subscribeCursor } = useMapContext();
  const format = useSettingsStore((s) => s.coordinateFormat);
  const [position, setPosition] = useState<LatLon | null>(null);

  useEffect(() => subscribeCursor(setPosition), [subscribeCursor]);

  if (!position) return null;
  const secondary =
    format === "mgrs" ? null : toMgrs(position.lat, position.lon);

  return (
    <div
      className={cn(
        "hud-panel pointer-events-none px-2 py-1 font-mono text-[10px] tabular-nums text-txt-secondary",
        className,
      )}
    >
      {formatLatLon(position, format)}
      {secondary && <span className="ml-3 text-txt-tertiary">{secondary}</span>}
    </div>
  );
}
