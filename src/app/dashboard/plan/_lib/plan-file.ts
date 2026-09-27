import { uid } from "@/lib/utils";
import type {
  MissionEndAction,
  MissionPlan,
  Waypoint,
  WaypointAction,
} from "@/types/mission";

const FORMAT = "pasupasastra-plan";
const ACTIONS: readonly WaypointAction[] = [
  "none",
  "hover",
  "photo",
  "release",
];
const END_ACTIONS: readonly MissionEndAction[] = ["rtl", "land", "hold"];

interface PlanFile {
  format: typeof FORMAT;
  version: 1;
  name: string;
  takeoffAltM: number;
  endAction: MissionEndAction;
  repeat: boolean;
  waypoints: Omit<Waypoint, "id">[];
}

export function serializePlan(plan: MissionPlan): string {
  const file: PlanFile = {
    format: FORMAT,
    version: 1,
    name: plan.name,
    takeoffAltM: plan.takeoffAltM,
    endAction: plan.endAction,
    repeat: plan.repeat,
    waypoints: plan.waypoints.map(({ id: _id, ...wp }) => wp),
  };
  return JSON.stringify(file, null, 2);
}

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

function parseWaypoint(value: unknown): Waypoint | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!isNum(v.lat) || !isNum(v.lon) || !isNum(v.altM)) return null;
  const action = ACTIONS.find((a) => a === v.action) ?? "none";
  return {
    id: uid("wp"),
    lat: v.lat,
    lon: v.lon,
    altM: v.altM,
    speedMs: isNum(v.speedMs) ? v.speedMs : null,
    holdS: isNum(v.holdS) ? v.holdS : 0,
    action,
  };
}

/** Parses an exported plan file. Returns null when the file is invalid. */
export function parsePlanFile(
  text: string,
  droneId: string,
): MissionPlan | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const f = data as Record<string, unknown>;
  if (f.format !== FORMAT || !Array.isArray(f.waypoints)) return null;

  const waypoints = f.waypoints.map(parseWaypoint);
  if (waypoints.some((w) => w === null)) return null;

  return {
    id: null,
    droneId,
    name: typeof f.name === "string" && f.name.trim() ? f.name : "Misi impor",
    takeoffAltM: isNum(f.takeoffAltM) ? f.takeoffAltM : 30,
    endAction: END_ACTIONS.find((a) => a === f.endAction) ?? "rtl",
    repeat: f.repeat === true,
    waypoints: waypoints.filter((w): w is Waypoint => w !== null),
    updatedAt: null,
  };
}
