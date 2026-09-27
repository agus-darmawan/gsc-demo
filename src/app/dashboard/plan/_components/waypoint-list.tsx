"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { WAYPOINT_ACTION_LABEL } from "@/constants/labels";
import { formatLatLon } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { Waypoint, WaypointAction } from "@/types/mission";

const ACTION_OPTIONS = (
  Object.keys(WAYPOINT_ACTION_LABEL) as WaypointAction[]
).map((value) => ({
  value,
  label: WAYPOINT_ACTION_LABEL[value],
}));

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

interface WaypointListProps {
  waypoints: Waypoint[];
  selectedId: string | null;
  maxAltM: number;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Waypoint>) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}

export function WaypointList({
  waypoints,
  selectedId,
  maxAltM,
  onSelect,
  onUpdate,
  onMove,
  onRemove,
}: WaypointListProps) {
  const format = useSettingsStore((s) => s.coordinateFormat);

  useEffect(() => {
    if (selectedId)
      document
        .getElementById(`wp-${selectedId}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <ol className="flex flex-col">
      {waypoints.map((wp, i) => {
        const selected = wp.id === selectedId;
        const tooHigh = wp.altM > maxAltM;
        return (
          <li
            key={wp.id}
            id={`wp-${wp.id}`}
            className={cn(
              "border-b border-l-2 border-b-border-subtle",
              selected ? "border-l-cyan bg-cyan/5" : "border-l-transparent",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(selected ? null : wp.id)}
              aria-expanded={selected}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gcs-elevated/50"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-cyan/50 font-mono text-[10px] font-bold text-cyan">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-txt-secondary">
                {formatLatLon(wp, format)}
              </span>
              {wp.action !== "none" && (
                <Badge tone="violet">{WAYPOINT_ACTION_LABEL[wp.action]}</Badge>
              )}
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  tooHigh ? "text-red" : "text-txt-primary",
                )}
              >
                {wp.altM} m
              </span>
            </button>

            {selected && (
              <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                <label className="flex flex-col gap-1">
                  <span className="label">Ketinggian (m)</span>
                  <TextInput
                    type="number"
                    min={5}
                    value={wp.altM}
                    invalid={tooHigh}
                    onChange={(e) => {
                      const v = toNumber(e.target.value);
                      if (v !== null) onUpdate(wp.id, { altM: v });
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label">Kecepatan (m/s)</span>
                  <TextInput
                    type="number"
                    min={1}
                    placeholder="Jelajah"
                    value={wp.speedMs ?? ""}
                    onChange={(e) =>
                      onUpdate(wp.id, { speedMs: toNumber(e.target.value) })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label">Tahan (detik)</span>
                  <TextInput
                    type="number"
                    min={0}
                    value={wp.holdS}
                    onChange={(e) =>
                      onUpdate(wp.id, {
                        holdS: Math.max(0, toNumber(e.target.value) ?? 0),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="label">Aksi</span>
                  <Select
                    value={wp.action}
                    options={ACTION_OPTIONS}
                    onChange={(action) => onUpdate(wp.id, { action })}
                  />
                </label>
                {tooHigh && (
                  <p className="col-span-2 text-[11px] text-red">
                    Melebihi batas ketinggian drone ({maxAltM} m).
                  </p>
                )}
                <div className="col-span-2 flex items-center gap-1">
                  <IconButton
                    size="xs"
                    icon={ArrowUp}
                    label="Naikkan urutan"
                    disabled={i === 0}
                    onClick={() => onMove(wp.id, -1)}
                  />
                  <IconButton
                    size="xs"
                    icon={ArrowDown}
                    label="Turunkan urutan"
                    disabled={i === waypoints.length - 1}
                    onClick={() => onMove(wp.id, 1)}
                  />
                  <IconButton
                    size="xs"
                    variant="danger"
                    icon={Trash2}
                    label="Hapus titik"
                    className="ml-auto"
                    onClick={() => onRemove(wp.id)}
                  />
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
