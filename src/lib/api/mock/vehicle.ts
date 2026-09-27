import type { VehicleApi } from "../contracts";
import { latency } from "./db";
import { simEngine } from "./engine";

export const mockVehicleApi: VehicleApi = {
  async send(droneId, command) {
    await latency();
    return simEngine().command(droneId, command);
  },
};
