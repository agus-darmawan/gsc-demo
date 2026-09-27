"use client";

import { useEffect, useRef } from "react";
import type { LatLon } from "@/types/geo";
import { useMapContext } from "./map-context";

export type CameraTarget =
  | { kind: "point"; lat: number; lon: number; heightM?: number }
  | { kind: "bounds"; points: readonly LatLon[] };

interface MapCameraProps {
  target: CameraTarget | null;
  /** The camera moves whenever this value changes. */
  trigger: string | number | null;
  durationS?: number;
}

const MIN_RADIUS_M = 250;

export function MapCamera({
  target,
  trigger,
  durationS = 1.2,
}: MapCameraProps) {
  const { Cesium, viewer } = useMapContext();
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    const current = targetRef.current;
    if (trigger === null || !current || viewer.isDestroyed()) return;

    if (current.kind === "point") {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          current.lon,
          current.lat,
          current.heightM ?? 2_500,
        ),
        duration: durationS,
      });
      return;
    }

    if (current.points.length === 0) return;
    const cartesians = current.points.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0),
    );
    const sphere = Cesium.BoundingSphere.fromPoints(cartesians);
    sphere.radius = Math.max(sphere.radius * 1.3, MIN_RADIUS_M);
    viewer.camera.flyToBoundingSphere(sphere, { duration: durationS });
  }, [Cesium, viewer, trigger, durationS]);

  return null;
}
