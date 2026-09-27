"use client";

import { Maximize2, Minimize2, Video } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StreamPlayer } from "@/components/video/stream-player";
import { useStreams } from "@/hooks/use-streams";
import type { Drone } from "@/types/drone";

/** Primary camera of the active vehicle as a picture-in-picture window. */
export function VideoPip({ drone }: { drone: Drone }) {
  const { streams } = useStreams();
  const [collapsed, setCollapsed] = useState(false);

  const stream = useMemo(() => {
    const own = streams.filter((s) => s.droneId === drone.id);
    const primaryId = drone.videoSources.find((v) => v.primary)?.id;
    return own.find((s) => s.sourceId === primaryId) ?? own[0] ?? null;
  }, [streams, drone]);

  if (!stream) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="hud-panel absolute top-14 right-2 z-10 flex h-8 items-center gap-1.5 px-2.5 text-xs text-txt-secondary hover:text-cyan"
      >
        <Video size={13} aria-hidden />
        Tampilkan video
      </button>
    );
  }

  return (
    <section
      aria-label="Video wahana"
      className="hud-panel absolute top-14 right-2 z-10 w-[320px]"
    >
      <div className="flex h-7 items-center gap-2 border-b border-border-subtle px-2">
        <span
          className={
            stream.online
              ? "status-dot bg-red motion-safe:animate-pulse-dot"
              : "status-dot bg-txt-muted"
          }
        />
        <span className="truncate font-mono text-[10px] font-bold text-txt-primary">
          {drone.callsign}
        </span>
        <span className="truncate text-[11px] text-txt-tertiary">
          {stream.name}
        </span>
        <Link
          href={`/dashboard/video/focus?stream=${encodeURIComponent(stream.id)}`}
          title="Buka mode fokus"
          className="ml-auto text-txt-tertiary hover:text-cyan"
        >
          <Maximize2 size={12} />
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Sembunyikan"
          className="text-txt-tertiary hover:text-txt-primary"
        >
          <Minimize2 size={12} />
        </button>
      </div>
      <div className="aspect-video">
        <StreamPlayer url={stream.url} online={stream.online} />
      </div>
    </section>
  );
}
