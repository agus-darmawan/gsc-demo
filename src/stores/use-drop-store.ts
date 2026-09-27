import { create } from "zustand";
import { api, errorMessage } from "@/lib/api";
import type { DropTarget } from "@/types/drop";
import type { LoadStatus } from "./types";

interface DropState {
  targets: DropTarget[];
  status: LoadStatus;
  error: string | null;
  load: (force?: boolean) => Promise<void>;
  upsert: (target: DropTarget) => void;
  remove: (id: string) => void;
}

export const useDropStore = create<DropState>()((set, get) => ({
  targets: [],
  status: "idle",
  error: null,

  load: async (force = false) => {
    const { status } = get();
    if (status === "loading" || (status === "ready" && !force)) return;
    set({ status: "loading", error: null });
    try {
      const targets = await api.drops.list();
      set({ targets, status: "ready" });
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  upsert: (target) =>
    set((s) => ({
      targets: s.targets.some((t) => t.id === target.id)
        ? s.targets.map((t) => (t.id === target.id ? target : t))
        : [...s.targets, target],
    })),

  remove: (id) =>
    set((s) => ({ targets: s.targets.filter((t) => t.id !== id) })),
}));
