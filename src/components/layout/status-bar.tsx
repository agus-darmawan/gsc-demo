"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { DRONE_STATUS_LABEL } from "@/constants/labels";
import { useFleet } from "@/hooks/use-fleet";
import { batteryTone, STATUS_TONE } from "@/lib/drone-status";
import { cn } from "@/lib/utils";
import { useDroneStore } from "@/stores/use-drone-store";

const BATTERY_TEXT = {
  red: "text-red",
  amber: "text-amber",
  green: "text-txt-tertiary",
} as const;

/** Fleet strip: one chip per vehicle; click makes it the active vehicle. */
export function StatusBar() {
  const fleet = useFleet();
  const activeId = useDroneStore((s) => s.activeId);
  const setActive = useDroneStore((s) => s.setActive);
  const pathname = usePathname();
  const router = useRouter();

  const airborne = useMemo(
    () =>
      fleet.filter((f) => f.status === "airborne" || f.status === "returning")
        .length,
    [fleet],
  );

  const select = (id: string, flyable: boolean) => {
    if (flyable) setActive(id);
    if (pathname.startsWith("/dashboard/map")) {
      router.replace(`/dashboard/map?drone=${encodeURIComponent(id)}`, {
        scroll: false,
      });
    }
  };

  return (
    <div className="flex h-8 shrink-0 items-center gap-1 overflow-x-auto border-b border-border-subtle bg-gcs-primary px-3">
      {fleet.length === 0 && (
        <span className="font-mono text-[10px] text-txt-muted">
          Belum ada drone terdaftar
        </span>
      )}
      {fleet.map(({ drone, status, telemetry }) => {
        const tone = STATUS_TONE[status];
        const active = drone.id === activeId;
        const battery = telemetry?.batteryPct;
        const bTone = batteryTone(battery);
        return (
          <button
            key={drone.id}
            type="button"
            onClick={() => select(drone.id, drone.telemetry.enabled)}
            aria-pressed={active}
            title={`${drone.callsign} (${drone.model})`}
            className={cn(
              "flex h-6 shrink-0 items-center gap-2 border px-2 transition-colors",
              active
                ? "border-cyan/50 bg-cyan/5"
                : "border-transparent hover:border-border-subtle",
            )}
          >
            <span className={cn("status-dot", tone.dot)} aria-hidden />
            <span
              className={cn(
                "font-mono text-[10px] font-bold",
                active ? "text-cyan" : tone.text,
              )}
            >
              {drone.callsign}
            </span>
            <span className="font-mono text-[10px] text-txt-muted uppercase">
              {DRONE_STATUS_LABEL[status]}
            </span>
            {battery != null && bTone && status !== "lost" && (
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  BATTERY_TEXT[bTone],
                )}
              >
                {Math.round(battery)}%
              </span>
            )}
          </button>
        );
      })}
      {fleet.length > 0 && (
        <span className="ml-auto shrink-0 pl-3 font-mono text-[10px] text-txt-muted">
          {airborne}/{fleet.length} di udara
        </span>
      )}
    </div>
  );
}
