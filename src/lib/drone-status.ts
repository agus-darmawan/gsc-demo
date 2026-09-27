import { TELEMETRY_LOST_MS } from "@/constants/defaults";
import type { Drone, DroneStatus } from "@/types/drone";
import type { DroneLive } from "@/types/telemetry";

/** Collapses registry + live link + telemetry into one operator status. */
export function deriveStatus(
  drone: Drone,
  live: DroneLive | undefined,
  now: number,
): DroneStatus {
  if (!drone.telemetry.enabled) {
    return drone.videoSources.length > 0 ? "video-only" : "offline";
  }
  if (!live || live.link === "offline" || live.lastSeen === null)
    return "offline";
  if (live.link === "lost" || now - live.lastSeen > TELEMETRY_LOST_MS)
    return "lost";

  const t = live.telemetry;
  if (!t) return "offline";
  if (t.phase === "landed" || (t.phase == null && (t.altM ?? 0) < 1))
    return "landed";
  if (
    t.flightMode === "RTL" ||
    t.flightMode === "LAND" ||
    t.phase === "landing"
  ) {
    return "returning";
  }
  return "airborne";
}

export interface StatusTone {
  /** Tailwind classes for the status dot. */
  dot: string;
  /** Tailwind text color. */
  text: string;
  /** Hex color for map symbology. */
  hex: string;
}

export const STATUS_TONE: Record<DroneStatus, StatusTone> = {
  airborne: {
    dot: "bg-green motion-safe:animate-pulse-dot",
    text: "text-green",
    hex: "#3fb950",
  },
  returning: {
    dot: "bg-amber motion-safe:animate-pulse-dot",
    text: "text-amber",
    hex: "#d29922",
  },
  landed: {
    dot: "bg-txt-secondary",
    text: "text-txt-secondary",
    hex: "#8b949e",
  },
  lost: { dot: "bg-red", text: "text-red", hex: "#f85149" },
  offline: { dot: "bg-txt-muted", text: "text-txt-muted", hex: "#484f58" },
  "video-only": { dot: "bg-cyan", text: "text-cyan", hex: "#39d0d8" },
};

/** Status that allows sending flight commands. */
export function isControllable(status: DroneStatus): boolean {
  return status === "airborne" || status === "returning" || status === "landed";
}

export function batteryTone(
  pct: number | null | undefined,
): "red" | "amber" | "green" | null {
  if (pct == null || !Number.isFinite(pct)) return null;
  if (pct < 20) return "red";
  if (pct < 40) return "amber";
  return "green";
}
