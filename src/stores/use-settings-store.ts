import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppSettings } from "@/types/settings";

export const DEFAULT_SETTINGS: AppSettings = {
  coordinateFormat: "dd",
  speedUnit: "ms",
  mapLayer: "satellite",
  sttEngine: "browser",
  sttLanguage: "id-ID",
  alertSound: true,
};

interface SettingsState extends AppSettings {
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "pasupatastra.settings",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
