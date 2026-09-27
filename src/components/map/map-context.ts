"use client";

import { createContext, useContext } from "react";
import type { MapContextValue } from "./types";

export const MapContext = createContext<MapContextValue | null>(null);

/** Map layers render inside <MapCanvas>; the context exists once Cesium is ready. */
export function useMapContext(): MapContextValue {
  const value = useContext(MapContext);
  if (!value) throw new Error("Map layers must be rendered inside <MapCanvas>");
  return value;
}
