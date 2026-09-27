import type { CommandAck, VehicleCommand } from "@/types/command";

export interface VehicleApi {
  /** POST /drones/:id/commands */
  send(droneId: string, command: VehicleCommand): Promise<CommandAck>;
}
