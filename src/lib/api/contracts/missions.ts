import type { CommandAck } from "@/types/command";
import type { MissionPlan, MissionSummary } from "@/types/mission";

export interface MissionsApi {
  /** GET /missions?droneId= */
  list(droneId?: string): Promise<MissionSummary[]>;
  /** GET /missions/:id */
  get(id: string): Promise<MissionPlan>;
  /** POST /missions or PUT /missions/:id */
  save(plan: MissionPlan): Promise<MissionPlan>;
  /** DELETE /missions/:id */
  remove(id: string): Promise<void>;
  /** POST /drones/:id/mission -> uploads the plan to the vehicle */
  upload(droneId: string, plan: MissionPlan): Promise<CommandAck>;
}
