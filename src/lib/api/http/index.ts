import type { GcsApi } from "../contracts";
import { httpAssistantApi } from "./assistant";
import { httpAuthApi } from "./auth";
import { httpCamerasApi } from "./cameras";
import { httpDronesApi } from "./drones";
import { httpDropsApi } from "./drops";
import { httpEventsApi } from "./events";
import { httpMissionsApi } from "./missions";
import { httpModelsApi } from "./models";
import { httpRealtimeApi } from "./realtime";
import { httpStreamsApi } from "./streams";
import { httpSystemApi } from "./system";
import { httpVehicleApi } from "./vehicle";

export function createHttpApi(): GcsApi {
  return {
    auth: httpAuthApi,
    drones: httpDronesApi,
    cameras: httpCamerasApi,
    streams: httpStreamsApi,
    models: httpModelsApi,
    assistant: httpAssistantApi,
    missions: httpMissionsApi,
    vehicle: httpVehicleApi,
    drops: httpDropsApi,
    events: httpEventsApi,
    realtime: httpRealtimeApi,
    system: httpSystemApi,
  };
}
