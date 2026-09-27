import type { Cartesian2, Viewer } from "cesium";
import type { LatLon } from "@/types/geo";

export type CesiumLib = typeof import("cesium");

/** Result of a click on the map. */
export type MapPick =
  | { kind: "entity"; layer: string; id: string; position: LatLon | null }
  | { kind: "ground"; position: LatLon };

export interface DragHandler {
  onDrag?: (position: LatLon) => void;
  onDragEnd: (position: LatLon) => void;
}

export interface MapContextValue {
  Cesium: CesiumLib;
  viewer: Viewer;
  /** Enables dragging for an entity; returns an unregister function. */
  registerDraggable: (entityId: string, handler: DragHandler) => () => void;
  /** Mouse position stream (null when the cursor leaves the globe). */
  subscribeCursor: (listener: (position: LatLon | null) => void) => () => void;
  toLatLon: (windowPosition: Cartesian2) => LatLon | null;
}

export type MarkerKind = "waypoint" | "target" | "home" | "point";

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  kind: MarkerKind;
  /** Waypoint number or short code shown with the marker. */
  label?: string;
  color?: string;
  selected?: boolean;
  draggable?: boolean;
}

/**
 * Entity ids follow "layer:id" for interactive entities. Ids starting with
 * "~" are decorative (lines, rings) and never reported as picks.
 */
export function parseEntityId(
  entityId: string,
): { layer: string; id: string } | null {
  if (entityId.startsWith("~")) return null;
  const index = entityId.indexOf(":");
  if (index <= 0) return null;
  return { layer: entityId.slice(0, index), id: entityId.slice(index + 1) };
}
