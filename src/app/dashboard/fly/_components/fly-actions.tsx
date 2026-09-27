"use client";

import {
  Home,
  type LucideIcon,
  MapPin,
  PackageOpen,
  Pause,
  PlaneLanding,
  PlaneTakeoff,
  Play,
  Power,
  PowerOff,
} from "lucide-react";
import { READ_ONLY_REASON } from "@/constants/demo";
import type { FleetEntry } from "@/hooks/use-fleet";
import { isControllable } from "@/lib/drone-status";
import { cn } from "@/lib/utils";
import type { ActionKind } from "./pending-action";

interface ActionDef {
  kind: ActionKind;
  label: string;
  icon: LucideIcon;
  /** Reason the action is unavailable, or null when it can run. */
  blocked: (v: FleetEntry) => string | null;
}

const airborne = (v: FleetEntry) =>
  v.status === "airborne" || v.status === "returning";

const ACTIONS: ActionDef[] = [
  {
    kind: "arm",
    label: "Motor on",
    icon: Power,
    blocked: (v) =>
      v.status !== "landed"
        ? "Hanya saat di darat"
        : v.telemetry?.armed
          ? "Motor sudah aktif"
          : null,
  },
  {
    kind: "disarm",
    label: "Motor off",
    icon: PowerOff,
    blocked: (v) =>
      v.status !== "landed"
        ? "Hanya saat di darat"
        : !v.telemetry?.armed
          ? "Motor sudah mati"
          : null,
  },
  {
    kind: "takeoff",
    label: "Lepas landas",
    icon: PlaneTakeoff,
    blocked: (v) => (v.status !== "landed" ? "Drone sudah di udara" : null),
  },
  {
    kind: "land",
    label: "Mendarat",
    icon: PlaneLanding,
    blocked: (v) =>
      !airborne(v)
        ? "Drone di darat"
        : v.telemetry?.flightMode === "LAND"
          ? "Sedang mendarat"
          : null,
  },
  {
    kind: "rtl",
    label: "Pulang",
    icon: Home,
    blocked: (v) =>
      !airborne(v)
        ? "Drone di darat"
        : v.telemetry?.flightMode === "RTL"
          ? "Sedang kembali"
          : null,
  },
  {
    kind: "hold",
    label: "Tahan",
    icon: Pause,
    blocked: (v) => (!airborne(v) ? "Drone di darat" : null),
  },
  {
    kind: "mission-start",
    label: "Misi",
    icon: Play,
    blocked: (v) =>
      v.telemetry?.flightMode === "AUTO" ? "Misi sedang berjalan" : null,
  },
  {
    kind: "goto",
    label: "Ke titik",
    icon: MapPin,
    blocked: (v) => (!airborne(v) ? "Lepas landas terlebih dahulu" : null),
  },
  {
    kind: "payload-release",
    label: "Payload",
    icon: PackageOpen,
    blocked: (v) =>
      !airborne(v)
        ? "Drone di darat"
        : v.telemetry?.payload === "released"
          ? "Payload sudah dilepas"
          : null,
  },
];

interface FlyActionsProps {
  vehicle: FleetEntry;
  gotoMode: boolean;
  disabled: boolean;
  onAction: (kind: ActionKind) => void;
}

/** Vertical tool strip with the vehicle actions (QGC fly tools). */
export function FlyActions({
  vehicle,
  gotoMode,
  disabled,
  onAction,
}: FlyActionsProps) {
  const controllable = isControllable(vehicle.status);
  const commandable =
    vehicle.drone.demo ||
    (vehicle.live?.capabilities.includes("commands") ?? false);

  return (
    <nav
      aria-label="Aksi wahana"
      className="hud-panel absolute top-14 left-2 z-10 flex w-[68px] flex-col"
    >
      {ACTIONS.map(({ kind, label, icon: Icon, blocked }) => {
        const reason = !controllable
          ? "Link telemetri tidak aktif"
          : !commandable
            ? READ_ONLY_REASON
            : blocked(vehicle);
        const active = kind === "goto" && gotoMode;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onAction(kind)}
            disabled={disabled || reason !== null}
            aria-pressed={kind === "goto" ? active : undefined}
            title={reason ?? label}
            className={cn(
              "flex h-[52px] flex-col items-center justify-center gap-1 border-b border-border-subtle text-[10px] transition-colors last:border-b-0",
              "disabled:cursor-not-allowed disabled:opacity-30",
              active
                ? "bg-violet/20 text-violet-light"
                : "text-txt-secondary hover:bg-cyan/10 hover:text-cyan",
              kind === "payload-release" && reason === null && "text-orange",
            )}
          >
            <Icon size={17} aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
