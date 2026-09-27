"use client";

import { Download, History, Map as MapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { downloadText } from "@/lib/download";
import { formatDateTime, formatDistance, formatSpan } from "@/lib/format";
import { useDroneStore } from "@/stores/use-drone-store";
import { usePathStore } from "@/stores/use-path-store";
import type { FlightSession } from "@/types/telemetry";
import { toGpx } from "../_lib/gpx";

interface Row {
  session: FlightSession;
  callsign: string;
  live: boolean;
}

export function FlightLog() {
  const router = useRouter();
  const drones = useDroneStore((s) => s.drones);
  const current = usePathStore((s) => s.current);
  const history = usePathStore((s) => s.history);
  const loaded = usePathStore((s) => s.historyLoaded);
  const mergeHistory = usePathStore((s) => s.mergeHistory);
  const showHistory = usePathStore((s) => s.showHistory);

  useEffect(() => {
    for (const drone of drones) {
      if (!drone.telemetry.enabled || loaded[drone.id]) continue;
      api.drones
        .flights(drone.id)
        .then((sessions) => mergeHistory(drone.id, sessions))
        .catch(() => mergeHistory(drone.id, []));
    }
  }, [drones, loaded, mergeHistory]);

  const rows = useMemo<Row[]>(() => {
    const name = new Map(drones.map((d) => [d.id, d.callsign]));
    const list: Row[] = [];
    for (const session of Object.values(current)) {
      if (session.points.length > 1)
        list.push({
          session,
          callsign: name.get(session.droneId) ?? session.droneId,
          live: true,
        });
    }
    for (const sessions of Object.values(history)) {
      for (const session of sessions)
        list.push({
          session,
          callsign: name.get(session.droneId) ?? session.droneId,
          live: false,
        });
    }
    return list.sort((a, b) => b.session.startedAt - a.session.startedAt);
  }, [drones, current, history]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Belum ada riwayat terbang"
        description="Jejak tercatat otomatis saat drone terbang."
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-gcs-primary">
          <tr className="border-b border-border-subtle">
            {["Drone", "Mulai", "Durasi", "Jarak", "Titik", ""].map((h) => (
              <th
                key={h || "actions"}
                scope="col"
                className="label px-3 py-2 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ session, callsign, live }) => (
            <tr
              key={session.id}
              className="border-b border-border-subtle hover:bg-gcs-secondary/60"
            >
              <td className="px-3 py-2">
                <span className="font-mono text-xs font-bold text-txt-primary">
                  {callsign}
                </span>
                {live && (
                  <Badge tone="info" className="ml-2">
                    Sedang terbang
                  </Badge>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-[11px] text-txt-secondary">
                {formatDateTime(session.startedAt)}
              </td>
              <td className="px-3 py-2 font-mono text-[11px] text-txt-secondary">
                {formatSpan(session.endedAt - session.startedAt)}
              </td>
              <td className="px-3 py-2 font-mono text-[11px] text-txt-secondary">
                {formatDistance(session.distanceM)}
              </td>
              <td className="px-3 py-2 font-mono text-[11px] text-txt-tertiary">
                {session.points.length}
              </td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-1">
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={MapIcon}
                    label="Lihat di peta"
                    onClick={() => {
                      if (!live) showHistory(session.droneId, session.id);
                      router.push(
                        `/dashboard/map?drone=${encodeURIComponent(session.droneId)}`,
                      );
                    }}
                  />
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={Download}
                    label="Unduh GPX"
                    onClick={() => {
                      const stamp = new Date(session.startedAt)
                        .toISOString()
                        .slice(0, 16)
                        .replace(/[:T]/g, "-");
                      downloadText(
                        `${callsign}-${stamp}.gpx`,
                        toGpx(session, `${callsign} ${stamp}`),
                        "application/gpx+xml",
                      );
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
