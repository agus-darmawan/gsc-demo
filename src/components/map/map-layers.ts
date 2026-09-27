import type { Viewer } from "cesium";
import type { MapLayerId } from "@/types/settings";
import type { CesiumLib } from "./types";

export const MAP_LAYER_OPTIONS: readonly { id: MapLayerId; label: string }[] = [
  { id: "satellite", label: "Satelit" },
  { id: "street", label: "Jalan" },
  { id: "dark", label: "Gelap" },
  { id: "offline", label: "Offline" },
];

interface TileSource {
  url: string;
  maximumLevel: number;
}

const ARCGIS = "https://server.arcgisonline.com/ArcGIS/rest/services";

/** Locally served XYZ tiles (infra/data/tiles), for operations without internet. */
const TILES_BASE = process.env.NEXT_PUBLIC_TILES_URL ?? "/tiles";

/**
 * Several sources per layer are stacked (base first, then overlays such as
 * labels). Online sources need internet on the device that opens the console.
 */
const SOURCES: Record<MapLayerId, TileSource[]> = {
  satellite: [
    {
      url: `${ARCGIS}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
      maximumLevel: 19,
    },
  ],
  street: [
    { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", maximumLevel: 19 },
  ],
  dark: [
    {
      url: `${ARCGIS}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
      maximumLevel: 16,
    },
    {
      url: `${ARCGIS}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
      maximumLevel: 16,
    },
  ],
  offline: [{ url: `${TILES_BASE}/{z}/{x}/{y}.png`, maximumLevel: 20 }],
};

export function applyMapLayer(
  Cesium: CesiumLib,
  viewer: Viewer,
  layer: MapLayerId,
): void {
  viewer.imageryLayers.removeAll();

  // World imagery shipped with Cesium (Natural Earth II, zoom 0-2): always drawn
  // underneath, so the map never goes blank when there is no internet.
  viewer.imageryLayers.add(
    Cesium.ImageryLayer.fromProviderAsync(
      Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
      ),
      {},
    ),
  );

  for (const source of SOURCES[layer]) {
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: source.url,
        maximumLevel: source.maximumLevel,
      }),
    );
  }
}