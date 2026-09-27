"use client";

import { Plane } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DRONE_STATUS_LABEL } from "@/constants/labels";
import { useFleet } from "@/hooks/use-fleet";
import { STATUS_TONE } from "@/lib/drone-status";
import { cn } from "@/lib/utils";
import { useDroneStore } from "@/stores/use-drone-store";

/** Shown when no vehicle is selected: pick one to control. */
export function NoVehicle() {
  const fleet = useFleet();
  const setActive = useDroneStore((s) => s.setActive);
  const flyable = fleet.filter((f) => f.drone.telemetry.enabled);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gcs-root/60">
      <div className="panel w-80 p-4">
        <h2 className="text-sm font-semibold">
          Pilih drone untuk dikendalikan
        </h2>
        <p className="mt-1 text-xs text-txt-secondary">
          Hanya drone dengan telemetri aktif yang bisa dikendalikan.
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {flyable.map(({ drone, status }) => (
            <li key={drone.id}>
              <button
                type="button"
                onClick={() => setActive(drone.id)}
                className="flex w-full items-center gap-2 border border-border-subtle px-2.5 py-2 text-left hover:border-cyan/50"
              >
                <span className={cn("status-dot", STATUS_TONE[status].dot)} />
                <span className="font-mono text-xs font-bold">
                  {drone.callsign}
                </span>
                <span className="truncate text-[11px] text-txt-tertiary">
                  {drone.model}
                </span>
                <span className="ml-auto font-mono text-[10px] text-txt-muted uppercase">
                  {DRONE_STATUS_LABEL[status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {flyable.length === 0 && (
          <div className="mt-3 flex flex-col items-start gap-2">
            <p className="text-xs text-txt-tertiary">
              Belum ada drone dengan telemetri.
            </p>
            <Link href="/dashboard/drones">
              <Button icon={Plane} variant="primary">
                Tambah drone
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
