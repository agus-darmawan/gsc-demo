"use client";

import type { Cartesian2, Entity } from "cesium";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { LatLon } from "@/types/geo";
import { MapContext } from "./map-context";
import { applyMapLayer } from "./map-layers";
import { loadCesium } from "./load-cesium";
import {
  type CesiumLib,
  type DragHandler,
  type MapContextValue,
  type MapPick,
  parseEntityId,
} from "./types";

export interface MapView {
  lat: number;
  lon: number;
  heightM: number;
}

interface MapCanvasProps {
  initialView: MapView;
  children?: ReactNode;
  onPick?: (pick: MapPick) => void;
  /** Crosshair cursor; every click reports a ground position. */
  pickMode?: boolean;
  className?: string;
}

interface PositionEvent {
  position: Cartesian2;
}

interface MotionEvent {
  endPosition: Cartesian2;
}

function entityOf(Cesium: CesiumLib, picked: unknown): Entity | null {
  if (!Cesium.defined(picked)) return null;
  const id = (picked as { id?: unknown }).id;
  return id instanceof Cesium.Entity ? id : null;
}

/**
 * Cesium viewer in 2D mode. Layers are declared as children and draw into the
 * shared viewer through context, so every view composes the same map.
 */
export function MapCanvas({
  initialView,
  children,
  onPick,
  pickMode = false,
  className,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<MapContextValue | null>(null);
  const layer = useSettingsStore((s) => s.mapLayer);

  const onPickRef = useRef(onPick);
  const pickModeRef = useRef(pickMode);
  const initialViewRef = useRef(initialView);
  useEffect(() => {
    onPickRef.current = onPick;
    pickModeRef.current = pickMode;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const Cesium = await loadCesium();
      if (cancelled) return;

      const viewer = new Cesium.Viewer(container, {
        baseLayer: false,
        timeline: false,
        animation: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        geocoder: false,
        infoBox: false,
        selectionIndicator: false,
        creditContainer: document.createElement("div"),
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        skyBox: false,
        skyAtmosphere: false,
        sceneMode: Cesium.SceneMode.SCENE2D,
        mapMode2D: Cesium.MapMode2D.INFINITE_SCROLL,
      });
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#080c10");

      const view = initialViewRef.current;
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          view.lon,
          view.lat,
          view.heightM,
        ),
      });

      const draggables = new Map<string, DragHandler>();
      const cursorListeners = new Set<(p: LatLon | null) => void>();

      const toLatLon = (windowPosition: Cartesian2): LatLon | null => {
        const cartesian = viewer.camera.pickEllipsoid(
          windowPosition,
          viewer.scene.globe.ellipsoid,
        );
        if (!cartesian) return null;
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        return {
          lat: Cesium.Math.toDegrees(carto.latitude),
          lon: Cesium.Math.toDegrees(carto.longitude),
        };
      };

      let drag: {
        entity: Entity;
        handler: DragHandler;
        moved: boolean;
        last: LatLon | null;
      } | null = null;
      let suppressClickUntil = 0;
      const canvas = viewer.scene.canvas;
      const handler = new Cesium.ScreenSpaceEventHandler(canvas);

      handler.setInputAction((e: PositionEvent) => {
        if (pickModeRef.current) return;
        const entity = entityOf(Cesium, viewer.scene.pick(e.position));
        const dragHandler = entity ? draggables.get(entity.id) : undefined;
        if (!entity || !dragHandler) return;
        drag = { entity, handler: dragHandler, moved: false, last: null };
        viewer.scene.screenSpaceCameraController.enableInputs = false;
        canvas.style.cursor = "grabbing";
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

      handler.setInputAction((e: MotionEvent) => {
        if (drag) {
          const position = toLatLon(e.endPosition);
          if (!position) return;
          const cartesian = Cesium.Cartesian3.fromDegrees(
            position.lon,
            position.lat,
            0,
          );
          drag.entity.position = new Cesium.ConstantPositionProperty(cartesian);
          drag.moved = true;
          drag.last = position;
          drag.handler.onDrag?.(position);
          return;
        }

        if (cursorListeners.size > 0) {
          const position = toLatLon(e.endPosition);
          for (const listener of cursorListeners) listener(position);
        }

        const entity = entityOf(Cesium, viewer.scene.pick(e.endPosition));
        const interactive = entity && parseEntityId(entity.id);
        canvas.style.cursor = pickModeRef.current
          ? "crosshair"
          : interactive
            ? draggables.has(entity.id)
              ? "grab"
              : "pointer"
            : "";
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      handler.setInputAction((e: PositionEvent) => {
        if (!drag) return;
        const current = drag;
        drag = null;
        viewer.scene.screenSpaceCameraController.enableInputs = true;
        canvas.style.cursor = "";
        if (!current.moved) return;
        suppressClickUntil = performance.now() + 300;
        const position = toLatLon(e.position) ?? current.last;
        if (position) current.handler.onDragEnd(position);
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

      handler.setInputAction((e: PositionEvent) => {
        if (performance.now() < suppressClickUntil) return;
        const position = toLatLon(e.position);
        if (!pickModeRef.current) {
          const entity = entityOf(Cesium, viewer.scene.pick(e.position));
          const parsed = entity ? parseEntityId(entity.id) : null;
          if (parsed) {
            onPickRef.current?.({ kind: "entity", ...parsed, position });
            return;
          }
        }
        if (position) onPickRef.current?.({ kind: "ground", position });
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      const resize = () => {
        if (viewer.isDestroyed()) return;
        viewer.resize();
        viewer.scene.requestRender();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      requestAnimationFrame(resize);

      setContext({
        Cesium,
        viewer,
        toLatLon,
        registerDraggable: (entityId, dragHandler) => {
          draggables.set(entityId, dragHandler);
          return () => {
            if (draggables.get(entityId) === dragHandler)
              draggables.delete(entityId);
          };
        },
        subscribeCursor: (listener) => {
          cursorListeners.add(listener);
          return () => cursorListeners.delete(listener);
        },
      });

      cleanup = () => {
        observer.disconnect();
        handler.destroy();
        if (!viewer.isDestroyed()) viewer.destroy();
      };
    })().catch((error: unknown) => console.error("[map] init failed", error));

    return () => {
      cancelled = true;
      setContext(null);
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    if (!context || context.viewer.isDestroyed()) return;
    applyMapLayer(context.Cesium, context.viewer, layer);
  }, [context, layer]);

  useEffect(() => {
    if (!context || context.viewer.isDestroyed()) return;
    context.viewer.scene.canvas.style.cursor = pickMode ? "crosshair" : "";
  }, [context, pickMode]);

  return (
    <div className={cn("absolute inset-0 bg-gcs-root", className)}>
      <div ref={containerRef} className="grid-overlay absolute inset-0" />
      {context && (
        <MapContext.Provider value={context}>{children}</MapContext.Provider>
      )}
    </div>
  );
}
