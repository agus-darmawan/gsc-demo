"use client";

import { useEffect, useMemo } from "react";
import { deriveStatus } from "@/lib/drone-status";
import { useDroneStore } from "@/stores/use-drone-store";
import type { Drone, DroneStatus } from "@/types/drone";
import type { DroneLive, DroneTelemetry } from "@/types/telemetry";
import { useNow } from "./use-now";

export interface FleetEntry {
  drone: Drone;
  live: DroneLive | undefined;
  telemetry: DroneTelemetry | null;
  status: DroneStatus;
}

/** Loads the registry once and returns it joined with live state. */
export function useFleet(): FleetEntry[] {
  const drones = useDroneStore((s) => s.drones);
  const live = useDroneStore((s) => s.live);
  const load = useDroneStore((s) => s.load);
  const now = useNow(1000);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () =>
      drones.map((drone) => {
        const l = live[drone.id];
        return {
          drone,
          live: l,
          telemetry: l?.telemetry ?? null,
          status: deriveStatus(drone, l, now),
        };
      }),
    [drones, live, now],
  );
}

/** Single vehicle joined with live state, or null when unknown. */
export function useFleetEntry(id: string | null): FleetEntry | null {
  const drone = useDroneStore((s) =>
    id ? s.drones.find((d) => d.id === id) : undefined,
  );
  const live = useDroneStore((s) => (id ? s.live[id] : undefined));
  const now = useNow(1000);

  return useMemo(() => {
    if (!drone) return null;
    return {
      drone,
      live,
      telemetry: live?.telemetry ?? null,
      status: deriveStatus(drone, live, now),
    };
  }, [drone, live, now]);
}

/** The QGC-style active vehicle. */
export function useActiveVehicle(): FleetEntry | null {
  const activeId = useDroneStore((s) => s.activeId);
  return useFleetEntry(activeId);
}
