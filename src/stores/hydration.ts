import { useAppStore } from "./use-app-store";
import { useAuthStore } from "./use-auth-store";
import { useDroneStore } from "./use-drone-store";
import { useMissionStore } from "./use-mission-store";
import { useSettingsStore } from "./use-settings-store";
import { useStreamStore } from "./use-stream-store";

/**
 * Persisted stores skip automatic hydration so the static HTML matches the
 * first client render; they are restored once, right after mount.
 */
export async function rehydrateStores(): Promise<void> {
  await Promise.all([
    useAuthStore.persist.rehydrate(),
    useSettingsStore.persist.rehydrate(),
    useDroneStore.persist.rehydrate(),
    useMissionStore.persist.rehydrate(),
    useStreamStore.persist.rehydrate(),
  ]);
  useAppStore.getState().setHydrated();
}
