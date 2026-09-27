import { uid } from "@/lib/utils";
import type { MissionPlan, MissionSummary } from "@/types/mission";
import { ApiError } from "../client/errors";
import type { MissionsApi } from "../contracts";
import { clone, latency, readDb, updateDb } from "./db";
import { simEngine } from "./engine";

const toSummary = (plan: MissionPlan): MissionSummary => ({
  id: plan.id ?? "",
  name: plan.name,
  droneId: plan.droneId,
  waypointCount: plan.waypoints.length,
  updatedAt: plan.updatedAt ?? new Date().toISOString(),
});

export const mockMissionsApi: MissionsApi = {
  async list(droneId) {
    await latency();
    return readDb()
      .missions.filter((m) => !droneId || m.droneId === droneId)
      .map(toSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    await latency();
    const plan = readDb().missions.find((m) => m.id === id);
    if (!plan) throw new ApiError("Rencana misi tidak ditemukan", 404);
    return clone(plan);
  },

  async save(plan) {
    await latency(200);
    if (!plan.name.trim()) throw new ApiError("Nama rencana wajib diisi", 422);
    const saved: MissionPlan = {
      ...clone(plan),
      id: plan.id ?? uid("msn"),
      updatedAt: new Date().toISOString(),
    };
    updateDb((db) => {
      const index = db.missions.findIndex((m) => m.id === saved.id);
      if (index >= 0) db.missions[index] = saved;
      else db.missions.push(saved);
    });
    return clone(saved);
  },

  async remove(id) {
    await latency();
    updateDb((db) => {
      db.missions = db.missions.filter((m) => m.id !== id);
    });
  },

  async upload(droneId, plan) {
    await latency(400);
    return simEngine().uploadMission(droneId, clone(plan));
  },
};
