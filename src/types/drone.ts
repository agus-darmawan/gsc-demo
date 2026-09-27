export type DroneType = "multirotor" | "vtol" | "fixed-wing";

export type TelemetryProtocol =
  | "mavlink-udp"
  | "mavlink-tcp"
  | "mavlink-serial"
  | "websocket";

export type VideoProtocol = "rtmp" | "rtsp" | "webrtc" | "hls" | "srt";

export interface VideoSource {
  id: string;
  name: string;
  protocol: VideoProtocol;
  url: string;
  /** Primary source is used for picture-in-picture and thumbnails. */
  primary: boolean;
}

export interface TelemetryLink {
  enabled: boolean;
  protocol: TelemetryProtocol;
  url: string;
  /** MAVLink system id, null for non-MAVLink links. */
  systemId: number | null;
}

/** Per-vehicle limits used by failsafes and mission planning. */
export interface FlightParameters {
  rtlAltM: number;
  maxAltM: number;
  cruiseSpeedMs: number;
  lowBatteryPct: number;
}

/** Vehicle registry entry, stored by the backend. */
export interface Drone {
  id: string;
  callsign: string;
  model: string;
  type: DroneType;
  serialNumber: string | null;
  notes: string | null;
  /** Simulated vehicle for demo features (payload drop, mission execution). */
  demo: boolean;
  telemetry: TelemetryLink;
  videoSources: VideoSource[];
  params: FlightParameters;
  createdAt: string;
  updatedAt: string;
}

/** Payload for create / update. Timestamps are owned by the backend. */
export type DroneInput = Omit<Drone, "createdAt" | "updatedAt">;

export interface LinkTestResult {
  ok: boolean;
  latencyMs: number | null;
  message: string;
}

/** Summary state shown across the UI, derived from registry + live data. */
export type DroneStatus =
  | "airborne"
  | "returning"
  | "landed"
  | "lost"
  | "offline"
  | "video-only";
