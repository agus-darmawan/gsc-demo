"use client";

import { Ban, Crosshair, Pencil, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DROP_AFTER_LABEL, DROP_STATUS_LABEL } from "@/constants/labels";
import type { FleetEntry } from "@/hooks/use-fleet";
import { formatDistance, formatDuration } from "@/lib/format";
import { formatLatLon } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { DropTarget } from "@/types/drop";
import { ACTIVE_DROP, approachEstimate, DROP_TONE } from "../_lib/drop-form";

interface DropListProps {
  targets: DropTarget[];
  fleet: FleetEntry[];
  selectedId: string | null;
  busyId: string | null;
  onSelect: (target: DropTarget) => void;
  onEdit: (target: DropTarget) => void;
  onExecute: (target: DropTarget) => void;
  onCancel: (target: DropTarget) => void;
  onDelete: (target: DropTarget) => void;
}

const ORDER: Record<string, number> = { active: 0, draft: 1, done: 2 };

function rank(t: DropTarget): number {
  if (ACTIVE_DROP.has(t.status)) return ORDER.active ?? 0;
  if (t.status === "draft") return ORDER.draft ?? 1;
  return ORDER.done ?? 2;
}

export function DropList({
  targets,
  fleet,
  selectedId,
  busyId,
  onSelect,
  onEdit,
  onExecute,
  onCancel,
  onDelete,
}: DropListProps) {
  const format = useSettingsStore((s) => s.coordinateFormat);
  const sorted = [...targets].sort(
    (a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt),
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Crosshair}
        title="Belum ada titik drop"
        description="Isi koordinat target di atas atau pilih lokasi langsung di peta."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2 p-3">
      {sorted.map((target) => {
        const entry = fleet.find((f) => f.drone.id === target.droneId);
        const t = entry?.telemetry;
        const from =
          t?.lat != null && t.lon != null ? { lat: t.lat, lon: t.lon } : null;
        const estimate = approachEstimate(
          from,
          target,
          target.approachSpeedMs,
          target.dropAltM,
          entry?.status === "landed",
        );
        const active = ACTIVE_DROP.has(target.status);
        const editable = !active;
        const busy = busyId === target.id;

        return (
          <li
            key={target.id}
            className={cn(
              "panel-inset border-l-2",
              selectedId === target.id
                ? "border-l-cyan"
                : active
                  ? "border-l-amber"
                  : "border-l-transparent",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(target)}
              className="flex w-full flex-col gap-1 px-3 pt-2.5 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange">
                  {target.code}
                </span>
                <Badge tone={DROP_TONE[target.status]}>
                  {DROP_STATUS_LABEL[target.status]}
                </Badge>
                <span className="ml-auto font-mono text-[10px] text-txt-secondary">
                  {entry?.drone.callsign ?? "Belum ditugaskan"}
                </span>
              </div>
              <span className="font-mono text-[10px] text-txt-tertiary">
                {formatLatLon(target, format)}
              </span>
              <span className="text-[11px] text-txt-secondary">
                Drop {target.dropAltM} m, {target.approachSpeedMs} m/s, lalu{" "}
                {DROP_AFTER_LABEL[target.afterAction].toLowerCase()}
                {estimate &&
                  !["completed", "cancelled", "failed"].includes(
                    target.status,
                  ) && (
                    <span className="text-txt-tertiary">
                      {" "}
                      ({formatDistance(estimate.distanceM)}, ETA{" "}
                      {formatDuration(estimate.etaS)})
                    </span>
                  )}
              </span>
              {target.note && (
                <span className="text-[11px] text-txt-tertiary italic">
                  {target.note}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1 px-3 pt-2 pb-2.5">
              {active ? (
                <Button
                  size="xs"
                  variant="warning"
                  icon={Ban}
                  loading={busy}
                  onClick={() => onCancel(target)}
                >
                  Batalkan
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="primary"
                  icon={Play}
                  loading={busy}
                  disabled={!target.droneId}
                  title={
                    target.droneId ? undefined : "Pilih drone terlebih dahulu"
                  }
                  onClick={() => onExecute(target)}
                >
                  {target.status === "draft" ? "Jalankan" : "Jalankan lagi"}
                </Button>
              )}
              <IconButton
                size="xs"
                icon={Pencil}
                label="Ubah target"
                disabled={!editable || busy}
                className="ml-auto"
                onClick={() => onEdit(target)}
              />
              <IconButton
                size="xs"
                variant="danger"
                icon={Trash2}
                label="Hapus target"
                disabled={!editable || busy}
                onClick={() => onDelete(target)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
