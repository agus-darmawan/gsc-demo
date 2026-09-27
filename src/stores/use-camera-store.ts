import { create } from "zustand";
import { api, errorMessage } from "@/lib/api";
import type { Camera } from "@/types/camera";
import type { LoadStatus } from "./types";

interface CameraState {
  cameras: Camera[];
  status: LoadStatus;
  error: string | null;
  load: (force?: boolean) => Promise<void>;
  upsert: (camera: Camera) => void;
  remove: (id: string) => void;
}

export const useCameraStore = create<CameraState>()((set, get) => ({
  cameras: [],
  status: "idle",
  error: null,

  load: async (force = false) => {
    const { status } = get();
    if (status === "loading" || (status === "ready" && !force)) return;
    set({ status: "loading", error: null });
    try {
      set({ cameras: await api.cameras.list(), status: "ready" });
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  upsert: (camera) =>
    set((s) => ({
      cameras: s.cameras.some((c) => c.id === camera.id)
        ? s.cameras.map((c) => (c.id === camera.id ? camera : c))
        : [...s.cameras, camera],
    })),

  remove: (id) =>
    set((s) => ({ cameras: s.cameras.filter((c) => c.id !== id) })),
}));
