"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type CameraTarget,
  CursorReadout,
  DRONE_LAYER,
  DroneLayer,
  initialMapView,
  LayerSwitcher,
  MapCamera,
  MapCanvas,
  type MapMarker,
  type MapPick,
  MarkerLayer,
  PolylineLayer,
} from "@/components/map";
import { useCameraStore } from "@/stores/use-camera-store";
import { useDroneStore } from "@/stores/use-drone-store";
import { useDropStore } from "@/stores/use-drop-store";
import { usePathStore } from "@/stores/use-path-store";
import { DROP_COLOR } from "../../drop/_lib/drop-form";
import { DronePanel } from "./drone-panel";
import { FleetList } from "./fleet-list";

const BASE = "/dashboard/map";

/** Situational overview of every vehicle, drop target and flight track. */
export function FleetMap() {
  const params = useSearchParams();
  const router = useRouter();
  const droneId = params.get("drone");

  const [initialView] = useState(() => initialMapView(droneId, 8_000));
  const targets = useDropStore((s) => s.targets);
  const loadDrops = useDropStore((s) => s.load);
  const currentPath = usePathStore((s) =>
    droneId ? s.current[droneId]?.points : undefined,
  );
  const historySession = usePathStore((s) => {
    if (!droneId) return undefined;
    const sessionId = s.shown[droneId];
    return sessionId
      ? s.history[droneId]?.find((h) => h.id === sessionId)
      : undefined;
  });
  const selectedLat = useDroneStore((s) =>
    droneId ? s.live[droneId]?.telemetry?.lat : null,
  );
  const selectedLon = useDroneStore((s) =>
    droneId ? s.live[droneId]?.telemetry?.lon : null,
  );

  useEffect(() => {
    void loadDrops();
  }, [loadDrops]);

  const select = useCallback(
    (id: string | null) => {
      const href = id ? `${BASE}?drone=${encodeURIComponent(id)}` : BASE;
      router.replace(href, { scroll: false });
    },
    [router],
  );

  const onPick = (pick: MapPick) => {
    if (pick.kind === "entity" && pick.layer === DRONE_LAYER) select(pick.id);
    else if (pick.kind === "ground") select(null);
  };

  const hasFix = selectedLat != null && selectedLon != null;
  const selectionTarget: CameraTarget | null =
    hasFix && selectedLat != null && selectedLon != null
      ? { kind: "point", lat: selectedLat, lon: selectedLon, heightM: 2_500 }
      : null;

  const historyTarget: CameraTarget | null = historySession
    ? { kind: "bounds", points: historySession.points }
    : null;

  const dropMarkers = useMemo<MapMarker[]>(
    () =>
      targets
        .filter((t) => t.status !== "cancelled")
        .map((t) => ({
          id: t.id,
          lat: t.lat,
          lon: t.lon,
          kind: "target",
          label: t.code,
          color: DROP_COLOR[t.status],
        })),
    [targets],
  );

  const cameras = useCameraStore((s) => s.cameras);
  const loadCameras = useCameraStore((s) => s.load);
  useEffect(() => {
    void loadCameras();
  }, [loadCameras]);
  const cameraMarkers = useMemo<MapMarker[]>(
    () =>
      cameras
        .filter((c) => c.lat !== null && c.lon !== null)
        .map((c) => ({
          id: c.id,
          lat: c.lat ?? 0,
          lon: c.lon ?? 0,
          kind: "point",
          label: c.name,
          color: "#39d0d8",
        })),
    [cameras],
  );

  return (
    <div className="relative min-w-0 flex-1">
      <MapCanvas initialView={initialView} onPick={onPick}>
        <DroneLayer selectedId={droneId} />
        {historySession && historySession.points.length > 1 && (
          <PolylineLayer
            id="map-history"
            points={historySession.points}
            color="#d29922"
            dashed
          />
        )}
        {currentPath && currentPath.length > 1 && (
          <PolylineLayer
            id="map-current"
            points={currentPath}
            color="#39d0d8"
          />
        )}
        <MarkerLayer layer="map-drop" markers={dropMarkers} />
        <MarkerLayer layer="map-camera" markers={cameraMarkers} />
        <MapCamera target={selectionTarget} trigger={hasFix ? droneId : null} />
        <MapCamera
          target={historyTarget}
          trigger={historySession?.id ?? null}
        />
        <CursorReadout className="absolute bottom-11 left-3 z-10" />
      </MapCanvas>
      <FleetList selectedId={droneId} onSelect={select} />
      <LayerSwitcher className="absolute bottom-3 left-3 z-10" />
      {droneId && <DronePanel droneId={droneId} onClose={() => select(null)} />}
    </div>
  );
}
