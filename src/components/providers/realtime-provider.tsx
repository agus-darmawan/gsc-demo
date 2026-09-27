"use client";

import { useEffect } from "react";
import { api, type RealtimeMessage } from "@/lib/api";
import { playAlertTone } from "@/lib/audio";
import { useAppStore } from "@/stores/use-app-store";
import { useAuthStore } from "@/stores/use-auth-store";
import type { LinkUpdate } from "@/stores/use-drone-store";
import { useDroneStore } from "@/stores/use-drone-store";
import { useDropStore } from "@/stores/use-drop-store";
import { useEventStore } from "@/stores/use-event-store";
import { usePathStore } from "@/stores/use-path-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { useStreamStore } from "@/stores/use-stream-store";
import type { DropTarget } from "@/types/drop";
import type { GcsEvent } from "@/types/event";
import type { Stream } from "@/types/stream";
import type { DroneTelemetry, PathPoint } from "@/types/telemetry";

const FLUSH_MS = 200;
const ARCHIVE_MS = 5_000;

/**
 * Buffers realtime messages and applies them to the stores at a fixed rate,
 * so a 50 Hz MAVLink bridge does not trigger 50 renders per second.
 */
class RealtimeBuffer {
  private frames: Record<string, DroneTelemetry> = {};
  private links: Record<string, LinkUpdate> = {};
  private streams: Record<string, Stream> = {};
  private removedStreams: string[] = [];
  private events: GcsEvent[] = [];
  private drops: Record<string, DropTarget> = {};
  private dirty = false;

  push(message: RealtimeMessage): void {
    this.dirty = true;
    switch (message.type) {
      case "telemetry":
        this.frames[message.droneId] = {
          ...this.frames[message.droneId],
          ...message.data,
        };
        return;
      case "link":
        this.links[message.droneId] = {
          link: message.link,
          capabilities: message.capabilities,
          bridge: message.bridge,
        };
        return;
      case "stream":
        this.streams[message.stream.id] = message.stream;
        return;
      case "stream-removed":
        this.removedStreams.push(message.streamId);
        return;
      case "event":
        this.events.push(message.event);
        return;
      case "drop":
        this.drops[message.target.id] = message.target;
        return;
    }
  }

  flush(): void {
    if (!this.dirty) return;
    const { frames, links, events, drops, streams, removedStreams } = this;
    this.streams = {};
    this.removedStreams = [];
    const streamStore = useStreamStore.getState();
    for (const stream of Object.values(streams))
      streamStore.upsertStream(stream);
    for (const id of removedStreams) streamStore.removeStream(id);
    this.frames = {};
    this.links = {};
    this.events = [];
    this.drops = {};
    this.dirty = false;

    if (Object.keys(frames).length > 0 || Object.keys(links).length > 0) {
      useDroneStore.getState().applyRealtime(frames, links);
    }

    const points: Record<string, PathPoint> = {};
    for (const [id, f] of Object.entries(frames)) {
      if (f.lat == null || f.lon == null || f.phase === "landed") continue;
      points[id] = { t: f.timestamp, lat: f.lat, lon: f.lon, altM: f.altM };
    }
    if (Object.keys(points).length > 0) usePathStore.getState().append(points);

    if (events.length > 0) {
      useEventStore.getState().ingest(events);
      const critical = events.some((e) => e.severity === "critical");
      if (critical && useSettingsStore.getState().alertSound) playAlertTone();
    }
    const dropStore = useDropStore.getState();
    for (const target of Object.values(drops)) dropStore.upsert(target);
  }
}

export function RealtimeProvider() {
  const token = useAuthStore((s) => s.session?.accessToken ?? null);

  useEffect(() => {
    if (!token) return;
    const buffer = new RealtimeBuffer();
    const setStatus = useAppStore.getState().setRealtime;
    const disconnect = api.realtime.connect({
      onMessage: (message) => buffer.push(message),
      onStatus: setStatus,
    });
    const flushTimer = setInterval(() => buffer.flush(), FLUSH_MS);
    const archiveTimer = setInterval(
      () => usePathStore.getState().archiveStale(),
      ARCHIVE_MS,
    );
    void useEventStore.getState().load();

    return () => {
      disconnect();
      clearInterval(flushTimer);
      clearInterval(archiveTimer);
    };
  }, [token]);

  return null;
}
