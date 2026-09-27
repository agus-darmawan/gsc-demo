import type { GcsApi } from "../contracts";
import { mockAssistantApi } from "./assistant";
import { mockAuthApi } from "./auth";
import { mockCamerasApi } from "./cameras";
import { mockDronesApi } from "./drones";
import { mockDropsApi } from "./drops";
import { mockEventsApi } from "./events";
import { mockMissionsApi } from "./missions";
import { mockModelsApi } from "./models";
import { mockRealtimeApi } from "./realtime";
import { mockStreamsApi } from "./streams";
import { mockSystemApi } from "./system";
import { mockVehicleApi } from "./vehicle";

/** Fully simulated backend used when no API URL is configured. */
export function createMockApi(): GcsApi {
  return {
    auth: mockAuthApi,
    drones: mockDronesApi,
    cameras: mockCamerasApi,
    streams: mockStreamsApi,
    models: mockModelsApi,
    assistant: mockAssistantApi,
    missions: mockMissionsApi,
    vehicle: mockVehicleApi,
    drops: mockDropsApi,
    events: mockEventsApi,
    realtime: mockRealtimeApi,
    system: mockSystemApi,
  };
}

export { resetDb as resetMockDatabase } from "./db";
