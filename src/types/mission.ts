export type WaypointAction = "none" | "hover" | "photo" | "release";
export type MissionEndAction = "rtl" | "land" | "hold";

export interface Waypoint {
  id: string;
  lat: number;
  lon: number;
  altM: number;
  /** null = use vehicle cruise speed. */
  speedMs: number | null;
  /** Seconds to hold at the waypoint before continuing. */
  holdS: number;
  action: WaypointAction;
}

export interface MissionPlan {
  /** null until the plan is saved to the backend. */
  id: string | null;
  name: string;
  droneId: string;
  takeoffAltM: number;
  endAction: MissionEndAction;
  /** Restart from the first waypoint after the last one (patrol). */
  repeat: boolean;
  waypoints: Waypoint[];
  updatedAt: string | null;
}

export interface MissionSummary {
  id: string;
  name: string;
  droneId: string;
  waypointCount: number;
  updatedAt: string;
}

export interface MissionStats {
  distanceM: number;
  durationS: number;
  maxAltM: number;
  /** Estimated battery usage in percent, null when unknown. */
  batteryPct: number | null;
}
