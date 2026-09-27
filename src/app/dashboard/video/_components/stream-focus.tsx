"use client";

import { VideoOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ViewLoading } from "@/components/ui/loading";
import { DetectionOverlay } from "@/components/video/detection-overlay";
import { StreamPlayer } from "@/components/video/stream-player";
import { useStreams } from "@/hooks/use-streams";
import { api } from "@/lib/api";
import { useCaptions } from "../_hooks/use-captions";
import { useLatestDetections } from "../_hooks/use-latest-detections";
import { VIDEO_BASE } from "../_lib/routes";
import { CaptionFeed } from "./caption-feed";
import { FocusHeader } from "./focus-header";
import { VlmChat } from "./vlm-chat";

export function StreamFocus({ streamId }: { streamId: string }) {
  const { streams, loading, error } = useStreams();
  const stream = streams.find((s) => s.id === streamId);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const captions = useCaptions(streamId);
  const detections = useLatestDetections(
    streamId,
    (stream?.modelIds.length ?? 0) > 0,
  );

  // Only the focused stream keeps running inference (saves GPU).
  // Captions only run while someone watches: the lease is renewed every 30 s.
  useEffect(() => {
    const beat = () => api.streams.setFocus(streamId).catch(() => undefined);
    beat();
    const timer = window.setInterval(beat, 30_000);
    return () => {
      window.clearInterval(timer);
      api.streams.setFocus(null).catch(() => undefined);
    };
  }, [streamId]);

  if (!stream) {
    if (loading) return <ViewLoading label="Memuat stream…" />;
    return (
      <div className="grid-overlay flex flex-1 items-center justify-center">
        <EmptyState
          icon={VideoOff}
          title={error ? "Gagal memuat stream" : "Stream tidak ditemukan"}
          description={error ?? undefined}
          action={
            <Link
              href={VIDEO_BASE}
              className="text-xs text-cyan hover:underline"
            >
              Kembali ke grid
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <FocusHeader stream={stream} detections={detections} />
        <div className="relative min-h-0 flex-1">
          <StreamPlayer
            ref={videoRef}
            url={stream.url}
            online={stream.online}
            fit="contain"
          />
          {/* Annotated streams already carry boxes drawn by the worker. */}
          {!stream.annotated && (
            <DetectionOverlay frame={detections} videoRef={videoRef} />
          )}
        </div>
        <CaptionFeed captions={captions} />
      </div>
      <VlmChat
        key={streamId}
        streamId={streamId}
        videoRef={videoRef}
        latestCaption={captions[0] ?? null}
      />
    </div>
  );
}
