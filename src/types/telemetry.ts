export type FlightMode =
  | "MANUAL"
  | "STABILIZE"
  | "ALT_HOLD"
  | "POSHOLD"
  | "LOITER"
  | "GUIDED"
  | "AUTO"
  | "RTL"
  | "LAND";

export type LinkState = "connected" | "degraded" | "lost" | "offline";
export type GpsFix = "none" | "2d" | "3d" | "dgps" | "rtk";
export type FlightPhase = "landed" | "takeoff" | "airborne" | "landing";
export type PayloadState = "stowed" | "armed" | "released";

/**
 * Normalized telemetry frame. Every field is optional because vehicles report
 * different subsets; the backend bridge fills what the airframe supports and
 * the UI hides what is missing.
 */
export interface DroneTelemetry {
  timestamp: number;

  lat?: number | null;
  lon?: number | null;
  /** Altitude relative to home. */
  altM?: number | null;
  altMslM?: number | null;

  rollDeg?: number | null;
  pitchDeg?: number | null;
  headingDeg?: number | null;

  groundSpeedMs?: number | null;
  /** Positive = climbing. */
  climbRateMs?: number | null;

  satellites?: number | null;
  gpsFix?: GpsFix | null;
  hdop?: number | null;

  batteryPct?: number | null;
  batteryV?: number | null;
  batteryA?: number | null;

  rssiPct?: number | null;

  armed?: boolean | null;
  flightMode?: FlightMode | null;
  phase?: FlightPhase | null;

  homeLat?: number | null;
  homeLon?: number | null;
  distanceToHomeM?: number | null;
  flightTimeS?: number | null;

  missionSeq?: number | null;
  missionTotal?: number | null;
  payload?: PayloadState | null;
  gimbalPitchDeg?: number | null;
}

/** What the vehicle link supports: telemetry, commands, mission, drop, lens. */
export type DroneCapability =
  | "telemetry"
  | "commands"
  | "mission"
  | "drop"
  | "lens";

export interface DroneLive {
  link: LinkState;
  capabilities: DroneCapability[];
  /** Bridge kind reported by the server (dji, autel, sim, ...). */
  bridge: string | null;
  /** Epoch millis of the last telemetry frame. */
  lastSeen: number | null;
  telemetry: DroneTelemetry | null;
}

export interface PathPoint {
  t: number;
  lat: number;
  lon: number;
  altM?: number | null;
}

export interface FlightSession {
  id: string;
  droneId: string;
  startedAt: number;
  endedAt: number;
  distanceM: number;
  points: PathPoint[];
}
