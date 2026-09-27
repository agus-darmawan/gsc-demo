"use client";

import { Navigation, Route, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DRONE_STATUS_LABEL, FLIGHT_MODE_LABEL } from "@/constants/labels";
import { useFleetEntry } from "@/hooks/use-fleet";
import { useNow } from "@/hooks/use-now";
import { batteryTone, STATUS_TONE } from "@/lib/drone-status";
import {
  formatAgo,
  formatDistance,
  formatDuration,
  formatSpeed,
} from "@/lib/format";
import { formatLatLon } from "@/lib/geo";
import { cn, has } from "@/lib/utils";
import { useDroneStore } from "@/stores/use-drone-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useStreamStore } from "@/stores/use-stream-store";
import type { DroneTelemetry } from "@/types/telemetry";
import { PathHistory } from "./path-history";

type Row = [label: string, value: string];

const BAR = { red: "bg-red", amber: "bg-amber", green: "bg-green" } as const;
const TEXT = {
  red: "text-red",
  amber: "text-amber",
  green: "text-green",
} as const;

function buildRows(
  t: DroneTelemetry,
  speedUnit: Parameters<typeof formatSpeed>[1],
): Row[] {
  const rows: (Row | false)[] = [
    has(t.altM) && ["Ketinggian", `${t.altM.toFixed(1)} m`],
    has(t.groundSpeedMs) && [
      "Kecepatan",
      formatSpeed(t.groundSpeedMs, speedUnit),
    ],
    has(t.headingDeg) && ["Arah", `${Math.round(t.headingDeg)}°`],
    has(t.climbRateMs) && ["Vertikal", `${t.climbRateMs.toFixed(1)} m/s`],
    !!t.flightMode && ["Mode", FLIGHT_MODE_LABEL[t.flightMode]],
    has(t.satellites) && ["Satelit", String(t.satellites)],
    has(t.distanceToHomeM) && ["Ke home", formatDistance(t.distanceToHomeM)],
    has(t.rssiPct) && ["Link", `${t.rssiPct}%`],
    has(t.flightTimeS) &&
      t.flightTimeS > 0 && ["Terbang", formatDuration(t.flightTimeS)],
  ];
  return rows.filter((r): r is Row => r !== false);
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-4 text-center font-mono text-[10px] text-txt-tertiary">
      {children}
    </div>
  );
}

export function DronePanel({
  droneId,
  onClose,
}: {
  droneId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const entry = useFleetEntry(droneId);
  const setActive = useDroneStore((s) => s.setActive);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const format = useSettingsStore((s) => s.coordinateFormat);
  const streams = useStreamStore((s) => s.streams);
  const loadStreams = useStreamStore((s) => s.load);
  const now = useNow(1000);

  useEffect(() => {
    void loadStreams();
  }, [loadStreams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stream = useMemo(
    () => streams.find((s) => s.droneId === droneId) ?? null,
    [streams, droneId],
  );

  if (!entry) {
    return (
      <aside className="hud-panel absolute top-3 right-3 z-10 w-72">
        <Notice>Drone tidak ditemukan</Notice>
      </aside>
    );
  }

  const { drone, telemetry: t, status, live } = entry;
  const tone = STATUS_TONE[status];
  const rows = t ? buildRows(t, speedUnit) : [];
  const battery = t?.batteryPct;
  const bTone = batteryTone(battery);
  const position =
    t?.lat != null && t.lon != null ? { lat: t.lat, lon: t.lon } : null;
  const lastSeen = live?.lastSeen ?? null;

  return (
    <aside className="hud-panel absolute top-3 right-3 z-10 flex max-h-[calc(100%-1.5rem)] w-72 flex-col overflow-y-auto motion-safe:animate-slide-in">
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
        <span className={cn("status-dot", tone.dot)} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-xs font-bold text-txt-primary">
            {drone.callsign}
          </div>
          <div className="truncate text-[11px] text-txt-tertiary">
            {drone.model}{" "}
            <span className={tone.text}>{DRONE_STATUS_LABEL[status]}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel"
          className="p-1 text-txt-tertiary hover:text-txt-primary"
        >
          <X size={14} />
        </button>
      </div>

      {!drone.telemetry.enabled ? (
        <Notice>
          Telemetri tidak didukung
          {drone.videoSources.length > 0 && (
            <span className="mt-1 block text-cyan">Hanya video</span>
          )}
        </Notice>
      ) : !t ? (
        <Notice>Menunggu telemetri…</Notice>
      ) : (
        <div className="flex flex-col gap-2 p-3">
          {has(battery) && bTone && (
            <div>
              <div className="mb-1 flex justify-between">
                <span className="label">Baterai</span>
                <span
                  className={cn("font-mono text-[10px] font-bold", TEXT[bTone])}
                >
                  {Math.round(battery)}%
                  {has(t.batteryV) ? ` / ${t.batteryV.toFixed(1)} V` : ""}
                </span>
              </div>
              <div className="h-1 bg-gcs-elevated">
                <div
                  className={cn("h-full", BAR[bTone])}
                  style={{ width: `${Math.min(100, Math.max(0, battery))}%` }}
                />
              </div>
            </div>
          )}
          {position && (
            <div className="panel-inset px-1.5 py-1">
              <div className="label">Posisi</div>
              <div className="mt-0.5 font-mono text-[10px] tabular-nums text-txt-secondary">
                {formatLatLon(position, format)}
              </div>
            </div>
          )}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {rows.map(([label, value]) => (
                <div key={label} className="panel-inset min-w-0 px-1.5 py-1">
                  <div className="label">{label}</div>
                  <div className="mt-0.5 truncate font-mono text-[10px] tabular-nums text-txt-secondary">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
          {lastSeen !== null && (
            <div
              className={cn(
                "text-right font-mono text-[10px]",
                now - lastSeen > 10_000
                  ? "text-red"
                  : now - lastSeen > 3_000
                    ? "text-amber"
                    : "text-txt-muted",
              )}
            >
              diperbarui {formatAgo(lastSeen, now)}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-t border-border-subtle px-3 py-2">
        {drone.telemetry.enabled && (
          <>
            <Button
              size="xs"
              variant="primary"
              icon={Navigation}
              onClick={() => {
                setActive(drone.id);
                router.push("/dashboard/fly");
              }}
            >
              Kendalikan
            </Button>
            <Button
              size="xs"
              icon={Route}
              onClick={() => {
                setActive(drone.id);
                router.push("/dashboard/plan");
              }}
            >
              Misi
            </Button>
          </>
        )}
        {stream && (
          <Button
            size="xs"
            icon={Video}
            onClick={() =>
              router.push(
                `/dashboard/video/focus?stream=${encodeURIComponent(stream.id)}`,
              )
            }
          >
            Video
          </Button>
        )}
      </div>

      {drone.telemetry.enabled && <PathHistory droneId={drone.id} />}
    </aside>
  );
}
