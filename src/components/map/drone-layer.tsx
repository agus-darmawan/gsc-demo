"use client";

import type { ConstantPositionProperty } from "cesium";
import { useEffect, useRef } from "react";
import { DEMO_HEX } from "@/constants/demo";
import { DRONE_STATUS_LABEL } from "@/constants/labels";
import { type FleetEntry, useFleet } from "@/hooks/use-fleet";
import { STATUS_TONE } from "@/lib/drone-status";
import { droneIcon } from "./icons";
import { useMapContext } from "./map-context";

export const DRONE_LAYER = "drone";

interface MarkerState {
  color: string;
  selected: boolean;
  heading: number;
  label: string;
  position: ConstantPositionProperty;
}

function buildLabel({ drone, telemetry: t, status }: FleetEntry): string {
  if (status === "lost" || status === "offline") {
    return `${drone.callsign}\n${DRONE_STATUS_LABEL[status]}`;
  }
  const parts = [
    t?.altM != null && `${t.altM.toFixed(0)} m`,
    t?.groundSpeedMs != null && `${t.groundSpeedMs.toFixed(1)} m/s`,
    t?.batteryPct != null && `${t.batteryPct.toFixed(0)}%`,
  ].filter(Boolean);
  return parts.length > 0
    ? `${drone.callsign}\n${parts.join("  ")}`
    : drone.callsign;
}

/** Every vehicle with a known position, colored by status. */
export function DroneLayer({
  selectedId = null,
}: {
  selectedId?: string | null;
}) {
  const { Cesium, viewer } = useMapContext();
  const fleet = useFleet();
  const markers = useRef(new Map<string, MarkerState>());

  useEffect(() => {
    if (viewer.isDestroyed()) return;
    const alive = new Set<string>();

    for (const entry of fleet) {
      const t = entry.telemetry;
      if (t?.lat == null || t.lon == null) continue;
      const id = entry.drone.id;
      alive.add(id);
      const position = Cesium.Cartesian3.fromDegrees(t.lon, t.lat, 0);

      let marker = markers.current.get(id);
      if (marker) {
        marker.position.setValue(position);
      } else {
        const state: MarkerState = {
          color: entry.drone.demo ? DEMO_HEX : STATUS_TONE[entry.status].hex,
          selected: false,
          heading: 0,
          label: entry.drone.demo
            ? `${entry.drone.callsign} · DEMO`
            : entry.drone.callsign,
          position: new Cesium.ConstantPositionProperty(position),
        };
        marker = state;
        const size = new Cesium.CallbackProperty(
          () => (state.selected ? 44 : 38),
          false,
        );
        viewer.entities.add({
          id: `${DRONE_LAYER}:${id}`,
          position: state.position,
          billboard: {
            image: new Cesium.CallbackProperty(
              () => droneIcon(state.color, state.selected),
              false,
            ),
            width: size,
            height: size,
            rotation: new Cesium.CallbackProperty(
              () => -Cesium.Math.toRadians(state.heading),
              false,
            ),
            alignedAxis: Cesium.Cartesian3.UNIT_Z,
          },
          label: {
            text: new Cesium.CallbackProperty(() => state.label, false),
            font: "11px monospace",
            fillColor: new Cesium.CallbackProperty(
              () =>
                state.selected
                  ? Cesium.Color.fromCssColorString("#39d0d8")
                  : Cesium.Color.WHITE,
              false,
            ),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -26),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString("#0d1117cc"),
            backgroundPadding: new Cesium.Cartesian2(6, 4),
          },
        });
        markers.current.set(id, marker);
      }

      marker.color = entry.drone.demo
        ? DEMO_HEX
        : STATUS_TONE[entry.status].hex;
      marker.selected = id === selectedId;
      marker.heading = t.headingDeg ?? 0;
      marker.label = buildLabel(entry);
    }

    for (const id of [...markers.current.keys()]) {
      if (alive.has(id)) continue;
      viewer.entities.removeById(`${DRONE_LAYER}:${id}`);
      markers.current.delete(id);
    }
  }, [Cesium, viewer, fleet, selectedId]);

  useEffect(() => {
    const current = markers.current;
    return () => {
      if (!viewer.isDestroyed()) {
        for (const id of current.keys())
          viewer.entities.removeById(`${DRONE_LAYER}:${id}`);
      }
      current.clear();
    };
  }, [viewer]);

  return null;
}
