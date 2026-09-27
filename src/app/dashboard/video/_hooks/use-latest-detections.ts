"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DetectionFrame } from "@/types/stream";

/** Polls the latest detections; disabled when the stream has no model. */
export function useLatestDetections(
  streamId: string,
  enabled: boolean,
  intervalMs = 1000,
): DetectionFrame | null {
  const [frame, setFrame] = useState<DetectionFrame | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFrame(null);
      return;
    }
    let alive = true;
    const tick = async () => {
      try {
        const next = await api.streams.latestDetections(streamId);
        if (alive) setFrame(next);
      } catch {
        /* keep the last frame */
      }
    };
    void tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [streamId, enabled, intervalMs]);

  return frame;
}
