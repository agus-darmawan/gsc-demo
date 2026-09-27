import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { TELEMETRY_STALE_MS } from "@/constants/defaults";
import { api, errorMessage } from "@/lib/api";
import type { Drone } from "@/types/drone";
import type {
  DroneCapability,
  DroneLive,
  DroneTelemetry,
  LinkState,
} from "@/types/telemetry";
import type { LoadStatus } from "./types";

export interface LinkUpdate {
  link: LinkState;
  capabilities?: DroneCapability[];
  bridge?: string | null;
}

interface DroneState {
  drones: Drone[];
  status: LoadStatus;
  error: string | null;
  live: Record<string, DroneLive>;
  /** Vehicle controlled by the fly / plan views (QGC "active vehicle"). */
  activeId: string | null;

  load: (force?: boolean) => Promise<void>;
  upsert: (drone: Drone) => void;
  remove: (id: string) => void;
  applyRealtime: (
    frames: Record<string, DroneTelemetry>,
    links: Record<string, LinkUpdate>,
  ) => void;
  setActive: (id: string | null) => void;
}

const canFly = (d: Drone) => d.telemetry.enabled;

function pickActive(drones: Drone[], current: string | null): string | null {
  if (current && drones.some((d) => d.id === current && canFly(d)))
    return current;
  return drones.find(canFly)?.id ?? null;
}

export const useDroneStore = create<DroneState>()(
  persist(
    (set, get) => ({
      drones: [],
      status: "idle",
      error: null,
      live: {},
      activeId: null,

      load: async (force = false) => {
        const { status } = get();
        if (status === "loading" || (status === "ready" && !force)) return;
        set({ status: "loading", error: null });
        try {
          const drones = await api.drones.list();
          set((s) => ({
            drones,
            status: "ready",
            activeId: pickActive(drones, s.activeId),
          }));
        } catch (error) {
          set({ status: "error", error: errorMessage(error) });
        }
      },

      upsert: (drone) =>
        set((s) => {
          const exists = s.drones.some((d) => d.id === drone.id);
          const drones = exists
            ? s.drones.map((d) => (d.id === drone.id ? drone : d))
            : [...s.drones, drone];
          return { drones, activeId: pickActive(drones, s.activeId) };
        }),

      remove: (id) =>
        set((s) => {
          const drones = s.drones.filter((d) => d.id !== id);
          const { [id]: _removed, ...live } = s.live;
          return { drones, live, activeId: pickActive(drones, s.activeId) };
        }),

      applyRealtime: (frames, links) =>
        set((s) => {
          const live = { ...s.live };
          const now = Date.now();
          for (const [id, frame] of Object.entries(frames)) {
            const prev = live[id];
            const fresh = now - frame.timestamp < TELEMETRY_STALE_MS;
            live[id] = {
              link: fresh ? "connected" : (prev?.link ?? "lost"),
              capabilities: prev?.capabilities ?? [],
              bridge: prev?.bridge ?? null,
              lastSeen: frame.timestamp,
              telemetry: { ...prev?.telemetry, ...frame },
            };
          }
          for (const [id, update] of Object.entries(links)) {
            const prev = live[id];
            live[id] = {
              link: update.link,
              capabilities: update.capabilities ?? prev?.capabilities ?? [],
              bridge:
                update.bridge !== undefined
                  ? update.bridge
                  : (prev?.bridge ?? null),
              lastSeen: prev?.lastSeen ?? null,
              telemetry: prev?.telemetry ?? null,
            };
          }
          return { live };
        }),

      setActive: (activeId) => set({ activeId }),
    }),
    {
      name: "pasupatastra.fleet",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ activeId: s.activeId }),
    },
  ),
);
