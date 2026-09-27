import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MissionPlan, Waypoint } from "@/types/mission";

export interface UploadedMission {
  planName: string;
  waypointCount: number;
  uploadedAt: number;
}

interface MissionState {
  /** Plan being edited, per drone (persisted so work is not lost). */
  drafts: Record<string, MissionPlan>;
  uploaded: Record<string, UploadedMission>;

  setDraft: (droneId: string, plan: MissionPlan) => void;
  patchDraft: (droneId: string, patch: Partial<MissionPlan>) => void;
  addWaypoints: (droneId: string, waypoints: Waypoint[]) => void;
  updateWaypoint: (
    droneId: string,
    id: string,
    patch: Partial<Waypoint>,
  ) => void;
  removeWaypoint: (droneId: string, id: string) => void;
  moveWaypoint: (droneId: string, id: string, direction: -1 | 1) => void;
  markUploaded: (droneId: string, plan: MissionPlan) => void;
}

function withDraft(
  state: MissionState,
  droneId: string,
  update: (plan: MissionPlan) => MissionPlan,
): Partial<MissionState> {
  const plan = state.drafts[droneId];
  if (!plan) return {};
  return { drafts: { ...state.drafts, [droneId]: update(plan) } };
}

export const useMissionStore = create<MissionState>()(
  persist(
    (set) => ({
      drafts: {},
      uploaded: {},

      setDraft: (droneId, plan) =>
        set((s) => ({ drafts: { ...s.drafts, [droneId]: plan } })),

      patchDraft: (droneId, patch) =>
        set((s) => withDraft(s, droneId, (p) => ({ ...p, ...patch }))),

      addWaypoints: (droneId, waypoints) =>
        set((s) =>
          withDraft(s, droneId, (p) => ({
            ...p,
            waypoints: [...p.waypoints, ...waypoints],
          })),
        ),

      updateWaypoint: (droneId, id, patch) =>
        set((s) =>
          withDraft(s, droneId, (p) => ({
            ...p,
            waypoints: p.waypoints.map((w) =>
              w.id === id ? { ...w, ...patch } : w,
            ),
          })),
        ),

      removeWaypoint: (droneId, id) =>
        set((s) =>
          withDraft(s, droneId, (p) => ({
            ...p,
            waypoints: p.waypoints.filter((w) => w.id !== id),
          })),
        ),

      moveWaypoint: (droneId, id, direction) =>
        set((s) =>
          withDraft(s, droneId, (p) => {
            const index = p.waypoints.findIndex((w) => w.id === id);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= p.waypoints.length)
              return p;
            const waypoints = [...p.waypoints];
            const [moved] = waypoints.splice(index, 1);
            if (moved) waypoints.splice(target, 0, moved);
            return { ...p, waypoints };
          }),
        ),

      markUploaded: (droneId, plan) =>
        set((s) => ({
          uploaded: {
            ...s.uploaded,
            [droneId]: {
              planName: plan.name,
              waypointCount: plan.waypoints.length,
              uploadedAt: Date.now(),
            },
          },
        })),
    }),
    {
      name: "pasupasastra.mission-drafts",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ drafts: s.drafts }),
    },
  ),
);
