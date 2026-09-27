import { create } from "zustand";
import type { RealtimeStatus } from "@/lib/api";

interface AppState {
  /** True once persisted stores have been restored from localStorage. */
  hydrated: boolean;
  realtime: RealtimeStatus;
  setHydrated: () => void;
  setRealtime: (status: RealtimeStatus) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  hydrated: false,
  realtime: "closed",
  setHydrated: () => set({ hydrated: true }),
  setRealtime: (realtime) => set({ realtime }),
}));
