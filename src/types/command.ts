import type { FlightMode } from "./telemetry";

export type CameraLens = "rgb" | "thermal" | "split";

export type VehicleCommand =
  | { type: "arm" }
  | { type: "disarm" }
  | { type: "takeoff"; altM: number }
  | { type: "land" }
  | { type: "rtl" }
  | { type: "hold" }
  | { type: "set-mode"; mode: FlightMode }
  | { type: "goto"; lat: number; lon: number; altM: number }
  | { type: "mission-start" }
  | { type: "mission-pause" }
  | { type: "payload-release" }
  | { type: "set-lens"; lens: CameraLens };

export type VehicleCommandType = VehicleCommand["type"];

export interface CommandAck {
  accepted: boolean;
  /** Operator-facing result message. */
  message: string;
}
