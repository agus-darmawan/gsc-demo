"use client";

import { Download, ScrollText, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SEVERITY_STYLE } from "@/components/events/severity";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TextInput } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { CATEGORY_LABEL, SEVERITY_LABEL } from "@/constants/labels";
import { downloadText, toCsv } from "@/lib/download";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDroneStore } from "@/stores/use-drone-store";
import { useEventStore } from "@/stores/use-event-store";
import type { EventCategory, EventSeverity } from "@/types/event";

type SeverityFilter = "all" | EventSeverity;
type CategoryFilter = "all" | EventCategory;

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "info", label: SEVERITY_LABEL.info },
  { value: "warning", label: SEVERITY_LABEL.warning },
  { value: "critical", label: SEVERITY_LABEL.critical },
];

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "Semua kategori" },
  ...(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((value) => ({
    value,
    label: CATEGORY_LABEL[value],
  })),
];

export function EventLog() {
  const events = useEventStore((s) => s.events);
  const load = useEventStore((s) => s.load);
  const markAllRead = useEventStore((s) => s.markAllRead);
  const drones = useDroneStore((s) => s.drones);

  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [droneId, setDroneId] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void load();
    markAllRead();
  }, [load, markAllRead]);

  const callsign = useMemo(
    () => new Map(drones.map((d) => [d.id, d.callsign])),
    [drones],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) =>
        (severity === "all" || e.severity === severity) &&
        (category === "all" || e.category === category) &&
        (droneId === "all" || e.droneId === droneId) &&
        (!q || e.message.toLowerCase().includes(q)),
    );
  }, [events, severity, category, droneId, query]);

  const exportCsv = () => {
    const rows = filtered.map((e) => [
      new Date(e.timestamp).toISOString(),
      SEVERITY_LABEL[e.severity],
      CATEGORY_LABEL[e.category],
      e.droneId ? (callsign.get(e.droneId) ?? e.droneId) : "",
      e.message,
    ]);
    const csv = toCsv(
      ["Waktu (UTC)", "Tingkat", "Kategori", "Drone", "Pesan"],
      rows,
    );
    downloadText(
      `log-kejadian-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv",
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <Segmented
          ariaLabel="Filter tingkat"
          value={severity}
          options={SEVERITY_OPTIONS}
          onChange={setSeverity}
          className="w-80"
        />
        <Select
          aria-label="Filter drone"
          value={droneId}
          onChange={setDroneId}
          options={[
            { value: "all", label: "Semua drone" },
            ...drones.map((d) => ({ value: d.id, label: d.callsign })),
          ]}
          className="w-40"
        />
        <Select
          aria-label="Filter kategori"
          value={category}
          onChange={setCategory}
          options={CATEGORY_OPTIONS}
          className="w-40"
        />
        <div className="relative">
          <Search
            size={12}
            className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-txt-muted"
            aria-hidden
          />
          <TextInput
            aria-label="Cari pesan"
            placeholder="Cari pesan"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-52 pl-6"
          />
        </div>
        <span className="ml-auto font-mono text-[10px] text-txt-tertiary">
          {filtered.length} dari {events.length}
        </span>
        <Button
          size="sm"
          icon={Download}
          disabled={filtered.length === 0}
          onClick={exportCsv}
        >
          Ekspor CSV
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={
              events.length === 0
                ? "Belum ada kejadian"
                : "Tidak ada kejadian yang cocok"
            }
          />
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-gcs-primary">
              <tr className="border-b border-border-subtle">
                {["Waktu", "Tingkat", "Kategori", "Drone", "Pesan"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="label px-3 py-2 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const style = SEVERITY_STYLE[e.severity];
                const Icon = style.icon;
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border-subtle hover:bg-gcs-secondary/60"
                  >
                    <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap text-txt-tertiary">
                      {formatTimestamp(e.timestamp)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-[11px]",
                          style.text,
                        )}
                      >
                        <Icon size={12} aria-hidden />
                        {SEVERITY_LABEL[e.severity]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-txt-secondary">
                      {CATEGORY_LABEL[e.category]}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-txt-secondary">
                      {e.droneId
                        ? (callsign.get(e.droneId) ?? e.droneId)
                        : "--"}
                    </td>
                    <td className="px-3 py-2 text-xs text-txt-primary">
                      {e.message}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
