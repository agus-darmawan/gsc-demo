"use client";

import { SlideToConfirm } from "@/components/ui/slide-to-confirm";
import { formatLatLon } from "@/lib/geo";
import { useSettingsStore } from "@/stores/use-settings-store";
import { describeAction, type PendingAction } from "./pending-action";

interface PendingBarProps {
  action: PendingAction;
  callsign: string;
  maxAltM: number;
  busy: boolean;
  onChange: (action: PendingAction) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Bottom-center confirmation with optional altitude selection. */
export function PendingBar({
  action,
  callsign,
  maxAltM,
  busy,
  onChange,
  onConfirm,
  onCancel,
}: PendingBarProps) {
  const format = useSettingsStore((s) => s.coordinateFormat);
  const { label, tone } = describeAction(action, callsign);

  return (
    <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 motion-safe:animate-fade-in">
      {(action.kind === "takeoff" || action.kind === "goto") && (
        <div className="hud-panel flex flex-col gap-1.5 px-3 py-2">
          {action.kind === "goto" && (
            <span className="font-mono text-[10px] text-txt-secondary">
              Tujuan {formatLatLon(action, format)}
            </span>
          )}
          <div className="flex items-center gap-3">
            <label htmlFor="pending-alt" className="label">
              Ketinggian
            </label>
            <input
              id="pending-alt"
              type="range"
              min={5}
              max={Math.max(10, maxAltM)}
              step={5}
              value={action.altM}
              onChange={(e) =>
                onChange({ ...action, altM: Number(e.target.value) })
              }
              className="w-52 accent-cyan"
            />
            <span className="w-14 text-right font-mono text-xs tabular-nums text-txt-primary">
              {action.altM} m
            </span>
          </div>
        </div>
      )}
      <SlideToConfirm
        key={action.kind}
        label={label}
        tone={tone}
        disabled={busy}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
}
