import type { FlightParameters } from "@/types/drone";
import type { LatLon } from "@/types/geo";

export const APP_NAME = "pasupasastra";
export const APP_TAGLINE = "Unified Command Center For Multi-drone Operations";

export const DEFAULT_FLIGHT_PARAMS: FlightParameters = {
  rtlAltM: 50,
  maxAltM: 300,
  cruiseSpeedMs: 12,
  lowBatteryPct: 20,
};

export const DEFAULT_TAKEOFF_ALT_M = 30;
export const DEFAULT_WAYPOINT_ALT_M = 60;
export const DEFAULT_DROP_ALT_M = 30;
export const DEFAULT_APPROACH_SPEED_MS = 8;

/** Initial camera when no vehicle position is known (Indonesia). */
export const DEFAULT_MAP_VIEW = { lat: -2.5, lon: 117, heightM: 2_000_000 };

/** Demo base (mock mode only). */
export const DEMO_BASE: LatLon = { lat: -6.2088, lon: 106.8456 };

/** Telemetry older than this is shown as degraded / lost. */
export const TELEMETRY_STALE_MS = 5_000;
export const TELEMETRY_LOST_MS = 15_000;
