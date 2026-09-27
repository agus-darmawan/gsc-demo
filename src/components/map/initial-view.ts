import { DEFAULT_MAP_VIEW, DEMO_BASE } from "@/constants/defaults";
import { USE_MOCK } from "@/lib/api";
import { useDroneStore } from "@/stores/use-drone-store";
import type { MapView } from "./map-canvas";

/**
 * Starting camera: the preferred vehicle, any vehicle with a fix, the demo
 * base in mock mode, otherwise the whole archipelago.
 */
export function initialMapView(
  preferredId: string | null,
  heightM = 3_500,
): MapView {
  const { live, activeId } = useDroneStore.getState();
  const candidates = [preferredId, activeId, ...Object.keys(live)];
  for (const id of candidates) {
    const t = id ? live[id]?.telemetry : null;
    if (t?.lat != null && t.lon != null)
      return { lat: t.lat, lon: t.lon, heightM };
  }
  if (USE_MOCK) return { ...DEMO_BASE, heightM };
  return DEFAULT_MAP_VIEW;
}
