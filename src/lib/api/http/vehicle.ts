import type { CommandAck } from "@/types/command";
import { http } from "../client/http";
import type { VehicleApi } from "../contracts";

export const httpVehicleApi: VehicleApi = {
  async send(droneId, command) {
    const { data } = await http.post<CommandAck>(
      `/drones/${encodeURIComponent(droneId)}/commands`,
      command,
    );
    return data;
  },
};
