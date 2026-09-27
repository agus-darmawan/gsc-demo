import type {
  Drone,
  DroneInput,
  LinkTestResult,
  TelemetryLink,
} from "@/types/drone";
import type { FlightSession } from "@/types/telemetry";

export interface DronesApi {
  /** GET /drones */
  list(): Promise<Drone[]>;
  /** GET /drones/:id */
  get(id: string): Promise<Drone>;
  /** POST /drones */
  create(input: DroneInput): Promise<Drone>;
  /** PUT /drones/:id */
  update(id: string, input: DroneInput): Promise<Drone>;
  /** DELETE /drones/:id */
  remove(id: string): Promise<void>;
  /** POST /drones/test-link (droneId lets the server check a connected bridge) */
  testLink(link: TelemetryLink, droneId?: string): Promise<LinkTestResult>;
  /** GET /drones/:id/flights */
  flights(id: string): Promise<FlightSession[]>;
}
