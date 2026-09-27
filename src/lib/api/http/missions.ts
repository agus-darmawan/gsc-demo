import type { CommandAck } from "@/types/command";
import type { MissionPlan, MissionSummary } from "@/types/mission";
import { http } from "../client/http";
import type { MissionsApi } from "../contracts";

const path = (id: string) => `/missions/${encodeURIComponent(id)}`;

export const httpMissionsApi: MissionsApi = {
  async list(droneId) {
    const { data } = await http.get<MissionSummary[]>("/missions", {
      params: droneId ? { droneId } : undefined,
    });
    return data;
  },
  async get(id) {
    const { data } = await http.get<MissionPlan>(path(id));
    return data;
  },
  async save(plan) {
    const { data } = plan.id
      ? await http.put<MissionPlan>(path(plan.id), plan)
      : await http.post<MissionPlan>("/missions", plan);
    return data;
  },
  async remove(id) {
    await http.delete(path(id));
  },
  async upload(droneId, plan) {
    const { data } = await http.post<CommandAck>(
      `/drones/${encodeURIComponent(droneId)}/mission`,
      plan,
    );
    return data;
  },
};
