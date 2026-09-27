"use client";

import type { Cartesian3 } from "cesium";
import { useEffect, useRef } from "react";
import type { LatLon } from "@/types/geo";
import { useMapContext } from "./map-context";

interface PolylineLayerProps {
  /** Unique id within the map. */
  id: string;
  points: readonly LatLon[];
  color: string;
  width?: number;
  dashed?: boolean;
  opacity?: number;
}

/** Decorative line (flight path, mission route, approach line). */
export function PolylineLayer({
  id,
  points,
  color,
  width = 2,
  dashed = false,
  opacity = 0.95,
}: PolylineLayerProps) {
  const { Cesium, viewer } = useMapContext();
  const positions = useRef<Cartesian3[]>([]);
  const entityId = `~line:${id}`;

  useEffect(() => {
    if (viewer.isDestroyed()) return;
    const cssColor = Cesium.Color.fromCssColorString(color).withAlpha(opacity);
    const entity = viewer.entities.add({
      id: entityId,
      polyline: {
        positions: new Cesium.CallbackProperty(() => positions.current, false),
        width,
        material: dashed
          ? new Cesium.PolylineDashMaterialProperty({
              color: cssColor,
              dashLength: 12,
            })
          : cssColor,
      },
    });
    return () => {
      if (!viewer.isDestroyed()) viewer.entities.remove(entity);
    };
  }, [Cesium, viewer, entityId, color, width, dashed, opacity]);

  useEffect(() => {
    const flat: number[] = [];
    for (const p of points) flat.push(p.lon, p.lat, 0);
    positions.current =
      points.length > 1 ? Cesium.Cartesian3.fromDegreesArrayHeights(flat) : [];
  }, [Cesium, points]);

  return null;
}
