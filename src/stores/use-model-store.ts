import { create } from "zustand";
import { api, errorMessage } from "@/lib/api";
import type { DetectionModel } from "@/types/model";
import type { LoadStatus } from "./types";

interface ModelState {
  models: DetectionModel[];
  status: LoadStatus;
  error: string | null;
  load: (force?: boolean) => Promise<void>;
  upsert: (model: DetectionModel) => void;
  remove: (id: string) => void;
}

export const useModelStore = create<ModelState>()((set, get) => ({
  models: [],
  status: "idle",
  error: null,

  load: async (force = false) => {
    const { status } = get();
    if (status === "loading" || (status === "ready" && !force)) return;
    set({ status: "loading", error: null });
    try {
      const models = await api.models.list();
      set({ models, status: "ready" });
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  upsert: (model) =>
    set((s) => ({
      models: s.models.some((m) => m.id === model.id)
        ? s.models.map((m) => (m.id === model.id ? model : m))
        : [model, ...s.models],
    })),

  remove: (id) => set((s) => ({ models: s.models.filter((m) => m.id !== id) })),
}));
