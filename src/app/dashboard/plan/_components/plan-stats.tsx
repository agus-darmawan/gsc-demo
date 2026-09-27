import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDistance, formatDuration } from "@/lib/format";
import type { MissionStats } from "@/types/mission";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="label">{label}</div>
      <div className="font-mono text-xs tabular-nums text-txt-primary">
        {value}
      </div>
    </div>
  );
}

export function PlanStats({
  stats,
  count,
}: {
  stats: MissionStats;
  count: number;
}) {
  const battery = stats.batteryPct;
  const tone =
    battery === null
      ? "cyan"
      : battery > 85
        ? "red"
        : battery > 65
          ? "amber"
          : "green";
  return (
    <div className="flex flex-col gap-2 border-t border-border-subtle px-3 py-3">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Titik" value={String(count)} />
        <Stat label="Jarak" value={formatDistance(stats.distanceM)} />
        <Stat label="Durasi" value={formatDuration(stats.durationS)} />
        <Stat label="Maks" value={`${Math.round(stats.maxAltM)} m`} />
      </div>
      {battery !== null && (
        <div>
          <div className="mb-1 flex justify-between">
            <span className="label">Perkiraan baterai</span>
            <span className="font-mono text-[10px] tabular-nums text-txt-secondary">
              {Math.round(battery)}%
            </span>
          </div>
          <ProgressBar
            value={battery}
            tone={tone}
            label="Perkiraan pemakaian baterai"
          />
          {battery > 85 && (
            <p className="mt-1 text-[11px] text-red">
              Misi terlalu panjang untuk satu baterai.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
