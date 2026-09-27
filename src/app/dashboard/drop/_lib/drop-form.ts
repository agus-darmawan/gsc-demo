import type { BadgeTone } from "@/components/ui/badge";
import {
  DEFAULT_APPROACH_SPEED_MS,
  DEFAULT_DROP_ALT_M,
} from "@/constants/defaults";
import { distanceM, isValidLatLon } from "@/lib/geo";
import { fromMgrs, toMgrs } from "@/lib/mgrs";
import type {
  DropAfterAction,
  DropStatus,
  DropTarget,
  DropTargetInput,
} from "@/types/drop";
import type { LatLon } from "@/types/geo";

export type CoordMode = "dd" | "mgrs";

export interface DropFormValues {
  droneId: string;
  coordMode: CoordMode;
  lat: string;
  lon: string;
  mgrs: string;
  dropAltM: string;
  approachSpeedMs: string;
  afterAction: DropAfterAction;
  note: string;
}

export type DropFormErrors = Partial<
  Record<"droneId" | "position" | "dropAltM" | "approachSpeedMs", string>
>;

export const ACTIVE_DROP: ReadonlySet<DropStatus> = new Set([
  "queued",
  "enroute",
  "stabilizing",
  "released",
  "returning",
]);

export const DROP_TONE: Record<DropStatus, BadgeTone> = {
  draft: "neutral",
  queued: "info",
  enroute: "info",
  stabilizing: "warning",
  released: "warning",
  returning: "info",
  completed: "success",
  cancelled: "neutral",
  failed: "danger",
};

/** Map symbology per status. */
export const DROP_COLOR: Record<DropStatus, string> = {
  draft: "#db6d28",
  queued: "#d29922",
  enroute: "#d29922",
  stabilizing: "#f85149",
  released: "#f85149",
  returning: "#39d0d8",
  completed: "#3fb950",
  cancelled: "#6e7681",
  failed: "#6e7681",
};

const num = (s: string) => Number(s.trim().replace(",", "."));

export function emptyDropForm(droneId: string): DropFormValues {
  return {
    droneId,
    coordMode: "dd",
    lat: "",
    lon: "",
    mgrs: "",
    dropAltM: String(DEFAULT_DROP_ALT_M),
    approachSpeedMs: String(DEFAULT_APPROACH_SPEED_MS),
    afterAction: "rtl",
    note: "",
  };
}

export function formFromTarget(t: DropTarget): DropFormValues {
  return {
    droneId: t.droneId ?? "",
    coordMode: "dd",
    lat: t.lat.toFixed(6),
    lon: t.lon.toFixed(6),
    mgrs: toMgrs(t.lat, t.lon) ?? "",
    dropAltM: String(t.dropAltM),
    approachSpeedMs: String(t.approachSpeedMs),
    afterAction: t.afterAction,
    note: t.note ?? "",
  };
}

export function withPosition(
  values: DropFormValues,
  p: LatLon,
): DropFormValues {
  return {
    ...values,
    lat: p.lat.toFixed(6),
    lon: p.lon.toFixed(6),
    mgrs: toMgrs(p.lat, p.lon) ?? "",
  };
}

export function formPosition(v: DropFormValues): LatLon | null {
  if (v.coordMode === "mgrs") return v.mgrs.trim() ? fromMgrs(v.mgrs) : null;
  if (!v.lat.trim() || !v.lon.trim()) return null;
  const lat = num(v.lat);
  const lon = num(v.lon);
  return isValidLatLon(lat, lon) ? { lat, lon } : null;
}

/** Switches input mode while carrying the current position across. */
export function switchCoordMode(
  v: DropFormValues,
  mode: CoordMode,
): DropFormValues {
  const position = formPosition(v);
  const next = { ...v, coordMode: mode };
  return position ? withPosition(next, position) : next;
}

export function validateDropForm(
  v: DropFormValues,
  maxAltM: number | null,
): DropFormErrors {
  const errors: DropFormErrors = {};
  if (!v.droneId) errors.droneId = "Pilih drone pelaksana";
  if (!formPosition(v)) {
    errors.position =
      v.coordMode === "mgrs"
        ? "MGRS tidak valid, contoh: 48M YU 02178 17060"
        : "Koordinat tidak valid (lintang -90..90, bujur -180..180)";
  }
  const alt = num(v.dropAltM);
  if (!Number.isFinite(alt) || alt < 5) errors.dropAltM = "Minimal 5 m";
  else if (maxAltM !== null && alt > maxAltM)
    errors.dropAltM = `Melebihi batas drone (${maxAltM} m)`;
  const speed = num(v.approachSpeedMs);
  if (!Number.isFinite(speed) || speed < 1 || speed > 25)
    errors.approachSpeedMs = "Antara 1 dan 25 m/s";
  return errors;
}

export function toDropInput(
  v: DropFormValues,
  position: LatLon,
): DropTargetInput {
  return {
    lat: position.lat,
    lon: position.lon,
    dropAltM: num(v.dropAltM),
    approachSpeedMs: num(v.approachSpeedMs),
    afterAction: v.afterAction,
    droneId: v.droneId || null,
    note: v.note.trim() || null,
  };
}

export function inputOf(t: DropTarget): DropTargetInput {
  return {
    lat: t.lat,
    lon: t.lon,
    dropAltM: t.dropAltM,
    approachSpeedMs: t.approachSpeedMs,
    afterAction: t.afterAction,
    droneId: t.droneId,
    note: t.note,
  };
}

/** Distance and rough time to reach the target (incl. takeoff and hover). */
export function approachEstimate(
  from: LatLon | null,
  target: LatLon,
  speedMs: number,
  dropAltM: number,
  landed: boolean,
): { distanceM: number; etaS: number } | null {
  if (!from) return null;
  const distance = distanceM(from, target);
  const climb = landed ? dropAltM / 3 + 4 : 0;
  return {
    distanceM: distance,
    etaS: distance / Math.max(1, speedMs) + climb + 3,
  };
}
