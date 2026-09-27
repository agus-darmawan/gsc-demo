import type { VehicleCommand } from "@/types/command";

/** Action waiting for slide-to-confirm. */
export type PendingAction =
  | { kind: "arm" }
  | { kind: "disarm" }
  | { kind: "takeoff"; altM: number }
  | { kind: "land" }
  | { kind: "rtl" }
  | { kind: "hold" }
  | { kind: "mission-start" }
  | { kind: "mission-pause" }
  | { kind: "payload-release" }
  | { kind: "goto"; lat: number; lon: number; altM: number };

export type ActionKind = PendingAction["kind"];

export function toCommand(action: PendingAction): VehicleCommand {
  switch (action.kind) {
    case "takeoff":
      return { type: "takeoff", altM: action.altM };
    case "goto":
      return {
        type: "goto",
        lat: action.lat,
        lon: action.lon,
        altM: action.altM,
      };
    default:
      return { type: action.kind };
  }
}

export type ActionTone = "primary" | "warning" | "danger";

export function describeAction(
  action: PendingAction,
  callsign: string,
): { label: string; tone: ActionTone } {
  switch (action.kind) {
    case "arm":
      return { label: `Aktifkan motor ${callsign}`, tone: "primary" };
    case "disarm":
      return { label: `Matikan motor ${callsign}`, tone: "warning" };
    case "takeoff":
      return { label: `Lepas landas ke ${action.altM} m`, tone: "primary" };
    case "land":
      return { label: "Mendarat di posisi saat ini", tone: "warning" };
    case "rtl":
      return { label: "Kembali ke home", tone: "warning" };
    case "hold":
      return { label: "Tahan posisi saat ini", tone: "primary" };
    case "mission-start":
      return { label: "Mulai atau lanjutkan misi", tone: "primary" };
    case "mission-pause":
      return { label: "Jeda misi", tone: "primary" };
    case "payload-release":
      return { label: "Lepas payload sekarang", tone: "danger" };
    case "goto":
      return {
        label: `Terbang ke titik pada ${action.altM} m`,
        tone: "primary",
      };
  }
}
