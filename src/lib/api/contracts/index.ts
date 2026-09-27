import type { AssistantApi } from "./assistant";
import type { AuthApi } from "./auth";
import type { CamerasApi } from "./cameras";
import type { DronesApi } from "./drones";
import type { DropsApi } from "./drops";
import type { EventsApi } from "./events";
import type { MissionsApi } from "./missions";
import type { ModelsApi } from "./models";
import type { RealtimeApi } from "./realtime";
import type { StreamsApi } from "./streams";
import type { SystemApi } from "./system";
import type { VehicleApi } from "./vehicle";

export type { AssistantApi } from "./assistant";
export type { AuthApi } from "./auth";
export type { CamerasApi } from "./cameras";
export type { DronesApi } from "./drones";
export type { DropsApi } from "./drops";
export type { EventsApi } from "./events";
export type { MissionsApi } from "./missions";
export type { ModelsApi } from "./models";
export type {
  RealtimeApi,
  RealtimeHandlers,
  RealtimeMessage,
  RealtimeStatus,
} from "./realtime";
export type { StreamsApi, Unsubscribe } from "./streams";
export type { HealthStatus, SystemApi } from "./system";
export type { VehicleApi } from "./vehicle";

/** Complete backend surface used by the GCS. */
export interface GcsApi {
  auth: AuthApi;
  drones: DronesApi;
  cameras: CamerasApi;
  streams: StreamsApi;
  models: ModelsApi;
  assistant: AssistantApi;
  missions: MissionsApi;
  vehicle: VehicleApi;
  drops: DropsApi;
  events: EventsApi;
  realtime: RealtimeApi;
  system: SystemApi;
}
