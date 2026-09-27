import { DEFAULT_WAYPOINT_ALT_M } from "@/constants/defaults";
import type { LatLon } from "@/types/geo";
import type { MissionPlan, MissionStats, Waypoint } from "@/types/mission";
import { distanceM, offsetM, toLocalM } from "./geo";
import { uid } from "./utils";

/** Rough multirotor energy model shared by planner and simulator (%/s). */
export const BATTERY_DRAIN = {
  hoverPerS: 0.045,
  perSpeedMs: 0.0035,
  climbPerMs: 0.01,
} as const;

const CLIMB_RATE_MS = 3;

export function createWaypoint(
  position: LatLon,
  altM: number = DEFAULT_WAYPOINT_ALT_M,
): Waypoint {
  return {
    id: uid("wp"),
    lat: position.lat,
    lon: position.lon,
    altM,
    speedMs: null,
    holdS: 0,
    action: "none",
  };
}

export function createEmptyPlan(droneId: string, name: string): MissionPlan {
  return {
    id: null,
    name,
    droneId,
    takeoffAltM: 30,
    endAction: "rtl",
    repeat: false,
    waypoints: [],
    updatedAt: null,
  };
}

/**
 * Distance, duration and battery estimate for a plan flown from `home`.
 * Includes takeoff climb, the waypoint legs and the return leg for RTL.
 */
export function missionStats(
  plan: MissionPlan,
  home: LatLon | null,
  cruiseSpeedMs: number,
): MissionStats {
  const wps = plan.waypoints;
  if (wps.length === 0) {
    return { distanceM: 0, durationS: 0, maxAltM: 0, batteryPct: null };
  }

  let distance = 0;
  let duration = plan.takeoffAltM / CLIMB_RATE_MS;
  let prev: LatLon | null = home;
  let prevAlt = plan.takeoffAltM;
  let maxAlt = plan.takeoffAltM;

  for (const wp of wps) {
    const speed = wp.speedMs ?? cruiseSpeedMs;
    if (prev) {
      const leg = distanceM(prev, wp);
      distance += leg;
      duration += leg / Math.max(1, speed);
    }
    duration += Math.abs(wp.altM - prevAlt) / CLIMB_RATE_MS + wp.holdS;
    prev = wp;
    prevAlt = wp.altM;
    maxAlt = Math.max(maxAlt, wp.altM);
  }

  const last = wps[wps.length - 1];
  if (plan.endAction === "rtl" && home && last) {
    const back = distanceM(last, home);
    distance += back;
    duration += back / Math.max(1, cruiseSpeedMs) + last.altM / 2;
  } else if (plan.endAction === "land" && last) {
    duration += last.altM / 2;
  }

  const drainPerS =
    BATTERY_DRAIN.hoverPerS + BATTERY_DRAIN.perSpeedMs * cruiseSpeedMs;
  return {
    distanceM: distance,
    durationS: duration,
    maxAltM: maxAlt,
    batteryPct: Math.min(100, duration * drainPerS),
  };
}

/**
 * Lawnmower survey over the rectangle spanned by two opposite corners.
 * Lines run along the longer side, spaced `spacingM` apart.
 */
export function generateSurvey(
  cornerA: LatLon,
  cornerB: LatLon,
  spacingM: number,
  altM: number,
): Waypoint[] {
  const b = toLocalM(cornerA, cornerB);
  const width = Math.abs(b.east);
  const height = Math.abs(b.north);
  if (width < 1 || height < 1 || spacingM <= 0) return [];

  const signE = Math.sign(b.east) || 1;
  const signN = Math.sign(b.north) || 1;
  const alongEast = width >= height;
  const across = alongEast ? height : width;
  const along = alongEast ? width : height;
  const lines = Math.max(1, Math.floor(across / spacingM) + 1);
  const step = lines > 1 ? across / (lines - 1) : 0;

  const waypoints: Waypoint[] = [];
  for (let i = 0; i < lines; i++) {
    const offset = i * step;
    const forward = i % 2 === 0;
    const start = forward ? 0 : along;
    const end = forward ? along : 0;
    for (const t of [start, end]) {
      const east = (alongEast ? t : offset) * signE;
      const north = (alongEast ? offset : t) * signN;
      waypoints.push(createWaypoint(offsetM(cornerA, north, east), altM));
    }
  }
  return waypoints;
}

/** Regular polygon around a center, handy for patrol loops. */
export function generateOrbit(
  center: LatLon,
  radiusM: number,
  points: number,
  altM: number,
): Waypoint[] {
  return Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2;
    return createWaypoint(
      offsetM(center, radiusM * Math.cos(angle), radiusM * Math.sin(angle)),
      altM,
    );
  });
}
