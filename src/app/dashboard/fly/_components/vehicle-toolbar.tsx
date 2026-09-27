"use client";

import {
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  type LucideIcon,
  Package,
  PackageOpen,
  Route,
  Satellite,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Timer,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import {
  DRONE_STATUS_LABEL,
  FLIGHT_MODE_LABEL,
  GPS_FIX_LABEL,
} from "@/constants/labels";
import type { FleetEntry } from "@/hooks/use-fleet";
import { batteryTone, STATUS_TONE } from "@/lib/drone-status";
import { formatDuration } from "@/lib/format";
import { cn, has } from "@/lib/utils";
import { useDroneStore } from "@/stores/use-drone-store";
import type { FlightMode } from "@/types/telemetry";

const MODES = Object.keys(FLIGHT_MODE_LABEL) as FlightMode[];

function Item({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  tone?: string;
  children: ReactNode;
}) {
  return (
    <div
      title={title}
      className="flex h-full shrink-0 items-center gap-1.5 border-l border-border-subtle px-3"
    >
      {Icon && (
        <Icon size={14} className={tone ?? "text-txt-tertiary"} aria-hidden />
      )}
      <span className="flex items-baseline gap-1 font-mono text-xs tabular-nums text-txt-primary">
        {children}
      </span>
    </div>
  );
}

function batteryIcon(pct: number | null | undefined): LucideIcon {
  if (!has(pct)) return Battery;
  if (pct < 15) return BatteryWarning;
  if (pct < 40) return BatteryLow;
  if (pct < 75) return BatteryMedium;
  return BatteryFull;
}

function signalIcon(pct: number | null | undefined): LucideIcon {
  if (!has(pct)) return Signal;
  if (pct < 35) return SignalLow;
  if (pct < 70) return SignalMedium;
  return SignalHigh;
}

const TONE_TEXT = {
  red: "text-red",
  amber: "text-amber",
  green: "text-green",
} as const;

interface VehicleToolbarProps {
  vehicle: FleetEntry;
  busy: boolean;
  onModeChange: (mode: FlightMode) => void;
}

/** Top status strip for the active vehicle (QGC main toolbar). */
export function VehicleToolbar({
  vehicle,
  busy,
  onModeChange,
}: VehicleToolbarProps) {
  const drones = useDroneStore((s) => s.drones);
  const setActive = useDroneStore((s) => s.setActive);
  const flyable = useMemo(
    () => drones.filter((d) => d.telemetry.enabled),
    [drones],
  );

  const t = vehicle.telemetry;
  const tone = STATUS_TONE[vehicle.status];
  const bTone = batteryTone(t?.batteryPct);
  const BatteryIcon = batteryIcon(t?.batteryPct);
  const SignalIcon = signalIcon(t?.rssiPct);
  const rssiTone = has(t?.rssiPct) && t.rssiPct < 35 ? "text-red" : undefined;
  const stale = vehicle.status === "lost" || vehicle.status === "offline";

  return (
    <div className="hud-panel absolute top-2 right-2 left-2 z-20 flex h-10 items-center overflow-x-auto">
      <div className="flex h-full shrink-0 items-center gap-2 px-3">
        <span className={cn("status-dot", tone.dot)} aria-hidden />
        <select
          aria-label="Drone aktif"
          value={vehicle.drone.id}
          onChange={(e) => setActive(e.target.value)}
          className="bg-transparent font-mono text-sm font-bold text-txt-primary focus:outline-none"
        >
          {flyable.map((d) => (
            <option key={d.id} value={d.id}>
              {d.callsign}
            </option>
          ))}
        </select>
        <span className={cn("font-mono text-[10px] uppercase", tone.text)}>
          {DRONE_STATUS_LABEL[vehicle.status]}
        </span>
      </div>

      <Item title="Status motor">
        <span
          className={cn(
            "text-[11px] font-bold",
            t?.armed ? "text-amber" : "text-txt-tertiary",
          )}
        >
          {t?.armed ? "MOTOR AKTIF" : "MOTOR MATI"}
        </span>
      </Item>

      <div className="flex h-full shrink-0 items-center border-l border-border-subtle px-2">
        <select
          aria-label="Mode terbang"
          value={t?.flightMode ?? ""}
          disabled={busy || stale || !t?.flightMode}
          onChange={(e) => {
            const mode = MODES.find((m) => m === e.target.value);
            if (mode) onModeChange(mode);
          }}
          className="h-7 border border-border bg-gcs-primary px-1.5 font-mono text-[11px] text-cyan focus:border-cyan/60 focus:outline-none disabled:opacity-50"
        >
          {!t?.flightMode && <option value="">Mode --</option>}
          {MODES.map((m) => (
            <option key={m} value={m}>
              {FLIGHT_MODE_LABEL[m]}
            </option>
          ))}
        </select>
      </div>

      <Item icon={Satellite} title="GPS: jumlah satelit, jenis fix, HDOP">
        {has(t?.satellites) ? t.satellites : "--"}
        <span className="text-[10px] text-txt-tertiary">
          {t?.gpsFix ? GPS_FIX_LABEL[t.gpsFix] : ""}
          {has(t?.hdop) ? ` HDOP ${t.hdop.toFixed(1)}` : ""}
        </span>
      </Item>

      <Item
        icon={BatteryIcon}
        title="Baterai"
        tone={bTone ? TONE_TEXT[bTone] : undefined}
      >
        <span className={bTone ? TONE_TEXT[bTone] : undefined}>
          {has(t?.batteryPct) ? `${Math.round(t.batteryPct)}%` : "--"}
        </span>
        {has(t?.batteryV) && (
          <span className="text-[10px] text-txt-tertiary">
            {t.batteryV.toFixed(1)} V
          </span>
        )}
      </Item>

      <Item icon={SignalIcon} title="Kualitas link telemetri" tone={rssiTone}>
        {has(t?.rssiPct) ? `${t.rssiPct}%` : "--"}
      </Item>

      <Item icon={Timer} title="Waktu terbang">
        {formatDuration(t?.flightTimeS)}
      </Item>

      {has(t?.missionTotal) && has(t?.missionSeq) && (
        <Item icon={Route} title="Progres misi" tone="text-cyan">
          WP {t.missionSeq}/{t.missionTotal}
        </Item>
      )}

      {t?.payload && (
        <Item
          icon={t.payload === "released" ? PackageOpen : Package}
          title="Status payload"
          tone={t.payload === "released" ? "text-orange" : "text-green"}
        >
          <span className="text-[11px]">
            {t.payload === "released" ? "Payload dilepas" : "Payload siap"}
          </span>
        </Item>
      )}
    </div>
  );
}
