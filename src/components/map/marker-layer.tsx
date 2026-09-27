"use client";

import type { Entity } from "cesium";
import { useEffect, useRef } from "react";
import type { LatLon } from "@/types/geo";
import { homeIcon, pointIcon, targetIcon, waypointIcon } from "./icons";
import { useMapContext } from "./map-context";
import type { MapMarker, MarkerKind } from "./types";

const DEFAULT_COLOR: Record<MarkerKind, string> = {
  waypoint: "#39d0d8",
  target: "#db6d28",
  home: "#3fb950",
  point: "#a371f7",
};

const SIZE: Record<MarkerKind, number> = {
  waypoint: 28,
  target: 40,
  home: 22,
  point: 22,
};

function iconFor(marker: MapMarker): string {
  const color = marker.color ?? DEFAULT_COLOR[marker.kind];
  const selected = marker.selected ?? false;
  switch (marker.kind) {
    case "waypoint":
      return waypointIcon(marker.label ?? "", color, selected);
    case "target":
      return targetIcon(color, selected);
    case "home":
      return homeIcon(color);
    default:
      return pointIcon(color);
  }
}

interface MarkerLayerProps {
  /** Entity id prefix; picks are reported with this layer name. */
  layer: string;
  markers: readonly MapMarker[];
  onDragEnd?: (id: string, position: LatLon) => void;
}

/** Point symbols (waypoints, drop targets, home) with optional dragging. */
export function MarkerLayer({ layer, markers, onDragEnd }: MarkerLayerProps) {
  const { Cesium, viewer, registerDraggable } = useMapContext();
  const entities = useRef(new Map<string, { entity: Entity; icon: string }>());
  const unregister = useRef(new Map<string, () => void>());
  const onDragEndRef = useRef(onDragEnd);
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  });

  useEffect(() => {
    if (viewer.isDestroyed()) return;
    const alive = new Set<string>();

    for (const marker of markers) {
      const entityId = `${layer}:${marker.id}`;
      alive.add(entityId);
      const position = Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat, 0);
      const icon = iconFor(marker);
      const existing = entities.current.get(entityId);

      if (existing) {
        existing.entity.position = new Cesium.ConstantPositionProperty(
          position,
        );
        if (existing.icon !== icon && existing.entity.billboard) {
          existing.entity.billboard.image = new Cesium.ConstantProperty(icon);
          existing.icon = icon;
        }
      } else {
        const size = SIZE[marker.kind];
        const entity = viewer.entities.add({
          id: entityId,
          position,
          billboard: { image: icon, width: size, height: size },
          label:
            marker.kind === "target" && marker.label
              ? {
                  text: marker.label,
                  font: "bold 11px monospace",
                  fillColor: Cesium.Color.fromCssColorString(
                    marker.color ?? DEFAULT_COLOR.target,
                  ),
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  verticalOrigin: Cesium.VerticalOrigin.TOP,
                  pixelOffset: new Cesium.Cartesian2(0, 22),
                  showBackground: true,
                  backgroundColor: Cesium.Color.fromCssColorString("#0d1117cc"),
                  backgroundPadding: new Cesium.Cartesian2(5, 3),
                }
              : undefined,
        });
        entities.current.set(entityId, { entity, icon });
      }

      const registered = unregister.current.has(entityId);
      if (marker.draggable && !registered) {
        unregister.current.set(
          entityId,
          registerDraggable(entityId, {
            onDragEnd: (p) => onDragEndRef.current?.(marker.id, p),
          }),
        );
      } else if (!marker.draggable && registered) {
        unregister.current.get(entityId)?.();
        unregister.current.delete(entityId);
      }
    }

    for (const entityId of [...entities.current.keys()]) {
      if (alive.has(entityId)) continue;
      viewer.entities.removeById(entityId);
      entities.current.delete(entityId);
      unregister.current.get(entityId)?.();
      unregister.current.delete(entityId);
    }
  }, [Cesium, viewer, layer, markers, registerDraggable]);

  useEffect(() => {
    const current = entities.current;
    const drags = unregister.current;
    return () => {
      for (const off of drags.values()) off();
      drags.clear();
      if (!viewer.isDestroyed()) {
        for (const entityId of current.keys())
          viewer.entities.removeById(entityId);
      }
      current.clear();
    };
  }, [viewer]);

  return null;
}
