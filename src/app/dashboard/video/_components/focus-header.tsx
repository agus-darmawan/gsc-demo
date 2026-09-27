"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { summarizeDetections } from "@/lib/video/detections";
import { useDroneStore } from "@/stores/use-drone-store";
import type { DetectionFrame, Stream } from "@/types/stream";
import { VIDEO_BASE } from "../_lib/routes";
import { LensSwitch } from "./lens-switch";
import { ModelSelect } from "./model-select";

export function FocusHeader({
  stream,
  detections,
}: {
  stream: Stream;
  detections: DetectionFrame | null;
}) {
  const groups = Object.entries(detections?.groups ?? {}).filter(
    ([, count]) => count > 0,
  );
  const summary = groups.length > 0 ? [] : summarizeDetections(detections);
  const timings = Object.entries(detections?.timingsMs ?? {});
  const callsign = useDroneStore(
    (s) => s.drones.find((d) => d.id === stream.droneId)?.callsign,
  );

  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border-subtle bg-gcs-primary px-3">
      <Link
        href={VIDEO_BASE}
        className="flex items-center gap-1 text-[11px] text-txt-tertiary hover:text-cyan"
      >
        <ArrowLeft size={12} aria-hidden />
        Grid
      </Link>
      <span className="h-4 w-px bg-border-subtle" aria-hidden />
      <span
        className={cn(
          "status-dot",
          stream.online
            ? "bg-red motion-safe:animate-pulse-dot"
            : "bg-txt-muted",
        )}
        aria-hidden
      />
      {callsign && (
        <span className="font-mono text-[11px] font-bold text-txt-primary">
          {callsign}
        </span>
      )}
      {stream.cameraId && (
        <span className="border border-cyan/40 px-1 font-mono text-[9px] text-cyan">
          CCTV
        </span>
      )}
      <span className="text-xs text-txt-secondary">{stream.name}</span>

      <div className="ml-auto flex min-w-0 items-center gap-3">
        {groups.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {groups.map(([group, count]) => (
              <span
                key={group}
                className="shrink-0 border border-violet/40 bg-violet/10 px-1.5 font-mono text-[10px] text-violet-light"
              >
                {group} {count}
              </span>
            ))}
          </div>
        )}
        {timings.length > 0 && (
          <span className="hidden shrink-0 font-mono text-[9px] text-txt-muted xl:inline">
            {timings
              .map(([key, ms]) => `${key} ${Math.round(ms)}ms`)
              .join(" · ")}
          </span>
        )}
        {summary.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {summary.map(({ label, count }) => (
              <span
                key={label}
                className="shrink-0 border border-violet/40 bg-violet/10 px-1.5 font-mono text-[10px] text-violet-light"
              >
                {label} {count}
              </span>
            ))}
          </div>
        )}
        {stream.droneId && <LensSwitch droneId={stream.droneId} />}
        <ModelSelect stream={stream} />
      </div>
    </div>
  );
}
