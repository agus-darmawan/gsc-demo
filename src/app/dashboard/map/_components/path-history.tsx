"use client";

import { Eye, EyeOff, History } from "lucide-react";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDateTime, formatDistance, formatSpan } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePathStore } from "@/stores/use-path-store";
import type { FlightSession } from "@/types/telemetry";

function Row({
  session,
  shown,
  onToggle,
  live,
}: {
  session: FlightSession;
  shown?: boolean;
  onToggle?: () => void;
  live?: boolean;
}) {
  const Icon = shown ? EyeOff : Eye;
  return (
    <li
      className={cn(
        "flex items-center gap-2 px-3 py-1.5",
        shown && "bg-amber/10",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] text-txt-secondary">
          {live ? "Rekaman saat ini" : formatDateTime(session.startedAt)}
        </p>
        <p className="font-mono text-[10px] text-txt-tertiary">
          {formatSpan(session.endedAt - session.startedAt)},{" "}
          {formatDistance(session.distanceM)}
        </p>
      </div>
      {live ? (
        <span
          className="status-dot bg-cyan motion-safe:animate-pulse-dot"
          aria-hidden
        />
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={shown}
          aria-label={shown ? "Sembunyikan jejak" : "Tampilkan jejak di peta"}
          className={cn(
            "p-1",
            shown ? "text-amber" : "text-txt-tertiary hover:text-txt-primary",
          )}
        >
          <Icon size={12} />
        </button>
      )}
    </li>
  );
}

/** Current track plus archived flights of one drone. */
export function PathHistory({ droneId }: { droneId: string }) {
  const current = usePathStore((s) => s.current[droneId]);
  const history = usePathStore((s) => s.history[droneId]);
  const loaded = usePathStore((s) => s.historyLoaded[droneId] ?? false);
  const shown = usePathStore((s) => s.shown[droneId] ?? null);
  const showHistory = usePathStore((s) => s.showHistory);
  const mergeHistory = usePathStore((s) => s.mergeHistory);

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    api.drones
      .flights(droneId)
      .then((sessions) => {
        if (!cancelled) mergeHistory(droneId, sessions);
      })
      .catch(() => {
        if (!cancelled) mergeHistory(droneId, []);
      });
    return () => {
      cancelled = true;
    };
  }, [droneId, loaded, mergeHistory]);

  return (
    <div className="border-t border-border-subtle">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <History size={12} className="text-txt-tertiary" aria-hidden />
        <span className="label">Riwayat terbang</span>
        {!loaded && <Spinner size={11} className="ml-auto" />}
      </div>
      <ul className="max-h-48 overflow-y-auto pb-1">
        {current && current.points.length > 1 && <Row session={current} live />}
        {(history ?? []).map((session) => (
          <Row
            key={session.id}
            session={session}
            shown={shown === session.id}
            onToggle={() =>
              showHistory(droneId, shown === session.id ? null : session.id)
            }
          />
        ))}
        {loaded && !current && (history ?? []).length === 0 && (
          <li className="px-3 py-2 font-mono text-[10px] text-txt-muted">
            Belum ada riwayat
          </li>
        )}
      </ul>
    </div>
  );
}
