"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { DRONE_STATUS_LABEL } from "@/constants/labels";
import { useFleet } from "@/hooks/use-fleet";
import { STATUS_TONE } from "@/lib/drone-status";
import { cn, has } from "@/lib/utils";

/** Compact fleet overview in the map corner. */
export function FleetList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const fleet = useFleet();
  const [open, setOpen] = useState(true);

  return (
    <section
      aria-label="Daftar armada"
      className="hud-panel absolute top-3 left-3 z-10 w-64"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span className="label">Armada</span>
        <span className="font-mono text-[10px] text-txt-muted">
          {fleet.length}
        </span>
        {open ? (
          <ChevronUp size={12} className="ml-auto text-txt-tertiary" />
        ) : (
          <ChevronDown size={12} className="ml-auto text-txt-tertiary" />
        )}
      </button>
      {open && (
        <ul className="max-h-72 overflow-y-auto border-t border-border-subtle">
          {fleet.map(({ drone, status, telemetry: t }) => (
            <li key={drone.id}>
              <button
                type="button"
                onClick={() => onSelect(drone.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-gcs-elevated/60",
                  selectedId === drone.id && "bg-cyan/10",
                )}
              >
                <span
                  className={cn("status-dot", STATUS_TONE[status].dot)}
                  aria-hidden
                />
                <span className="font-mono text-[11px] font-bold text-txt-primary">
                  {drone.callsign}
                </span>
                <span className="font-mono text-[10px] text-txt-muted uppercase">
                  {DRONE_STATUS_LABEL[status]}
                </span>
                <span className="ml-auto font-mono text-[10px] tabular-nums text-txt-tertiary">
                  {has(t?.altM) && status !== "lost"
                    ? `${Math.round(t.altM)} m`
                    : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
