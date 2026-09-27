"use client";

import { formatDistance, formatDuration, formatSpeed } from "@/lib/format";
import { bearingDeg } from "@/lib/geo";
import { cn, has } from "@/lib/utils";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { DroneTelemetry } from "@/types/telemetry";
import { AttitudeIndicator } from "./attitude-indicator";
import { Compass } from "./compass";

function Value({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 px-2 py-1.5">
      <div className="label">{label}</div>
      <div
        className={cn(
          "truncate font-mono text-sm tabular-nums text-txt-primary",
          tone,
        )}
      >
        {value}
      </div>
    </div>
  );
}

/** Attitude, heading and the key flight values (QGC "instrument panel"). */
export function InstrumentPanel({
  telemetry: t,
}: {
  telemetry: DroneTelemetry | null;
}) {
  const speedUnit = useSettingsStore((s) => s.speedUnit);

  const homeBearing =
    t &&
    has(t.lat) &&
    has(t.lon) &&
    has(t.homeLat) &&
    has(t.homeLon) &&
    (t.distanceToHomeM ?? 0) > 3
      ? bearingDeg(
          { lat: t.lat, lon: t.lon },
          { lat: t.homeLat, lon: t.homeLon },
        )
      : null;

  const climb = t?.climbRateMs;
  const voltage = t?.batteryV;

  return (
    <section
      aria-label="Instrumen penerbangan"
      className="hud-panel absolute right-2 bottom-2 z-10 w-[276px] select-none"
    >
      <div className="flex items-center justify-around border-b border-border-subtle px-1 py-1.5">
        <AttitudeIndicator rollDeg={t?.rollDeg} pitchDeg={t?.pitchDeg} />
        <Compass headingDeg={t?.headingDeg} homeBearingDeg={homeBearing} />
      </div>
      <div className="grid grid-cols-3 divide-x divide-border-subtle">
        <Value
          label="Ketinggian"
          value={has(t?.altM) ? `${t.altM.toFixed(1)} m` : "--"}
        />
        <Value
          label="Kec. darat"
          value={formatSpeed(t?.groundSpeedMs, speedUnit)}
        />
        <Value
          label="Kec. vertikal"
          value={
            has(climb)
              ? `${climb >= 0 ? "+" : ""}${climb.toFixed(1)} m/s`
              : "--"
          }
          tone={
            has(climb) && Math.abs(climb) > 0.3
              ? climb > 0
                ? "text-green"
                : "text-amber"
              : undefined
          }
        />
      </div>
      <div className="grid grid-cols-3 divide-x divide-border-subtle border-t border-border-subtle">
        <Value label="Jarak home" value={formatDistance(t?.distanceToHomeM)} />
        <Value label="Waktu terbang" value={formatDuration(t?.flightTimeS)} />
        <Value
          label="Tegangan"
          value={has(voltage) ? `${voltage.toFixed(1)} V` : "--"}
        />
      </div>
    </section>
  );
}
