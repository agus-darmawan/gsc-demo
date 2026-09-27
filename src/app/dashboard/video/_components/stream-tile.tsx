"use client";

import { Maximize2, X } from "lucide-react";
import Link from "next/link";
import { StreamPlayer } from "@/components/video/stream-player";
import { cn } from "@/lib/utils";
import { useDroneStore } from "@/stores/use-drone-store";
import { useModelStore } from "@/stores/use-model-store";
import { useStreamStore } from "@/stores/use-stream-store";
import type { Stream } from "@/types/stream";
import { streamHref } from "../_lib/routes";
import { ModelSelect } from "./model-select";

export function StreamTile({ stream }: { stream: Stream }) {
  const hide = useStreamStore((s) => s.hide);
  const models = useModelStore((s) => s.models);
  const active = models.filter((m) => stream.modelIds.includes(m.id));
  const callsign = useDroneStore(
    (s) => s.drones.find((d) => d.id === stream.droneId)?.callsign,
  );

  return (
    <div className="video-feed group min-h-0 min-w-0">
      <StreamPlayer url={stream.url} online={stream.online} />

      <div className="hud-panel absolute inset-x-0 top-0 flex items-center gap-2 px-2 py-1.5">
        <span
          className={cn(
            "status-dot shrink-0",
            stream.online
              ? "bg-red motion-safe:animate-pulse-dot"
              : "bg-txt-muted",
          )}
          aria-hidden
        />
        {callsign && (
          <span className="font-mono text-[10px] font-bold text-txt-primary">
            {callsign}
          </span>
        )}
        <span className="truncate text-[11px] text-txt-secondary">
          {stream.name}
        </span>
        {stream.cameraId && (
          <span className="shrink-0 border border-cyan/40 px-1 font-mono text-[9px] text-cyan">
            CCTV
          </span>
        )}
        {active.length > 0 && (
          <span
            title={active.map((m) => m.name).join(", ")}
            className="shrink-0 border border-violet/40 bg-violet/10 px-1 font-mono text-[9px] text-violet-light"
          >
            {active.length === 1 ? active[0]?.name : `${active.length} model`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <ModelSelect stream={stream} />
          <Link
            href={streamHref(stream.id)}
            title="Mode fokus"
            className="border border-border-subtle p-1 text-txt-muted hover:text-cyan"
          >
            <Maximize2 size={11} />
          </Link>
          <button
            type="button"
            onClick={() => hide(stream.id)}
            title="Sembunyikan dari grid"
            className="border border-border-subtle p-1 text-txt-muted hover:text-red"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
