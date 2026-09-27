"use client";

import { VideoOff } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ViewLoading } from "@/components/ui/loading";
import { useStreams } from "@/hooks/use-streams";
import { cn } from "@/lib/utils";
import { type PageSize, useStreamStore } from "@/stores/use-stream-store";
import { StreamTile } from "./stream-tile";
import { VideoToolbar } from "./video-toolbar";

const GRID: Record<PageSize, string> = {
  1: "grid-cols-1 grid-rows-1",
  4: "grid-cols-2 grid-rows-2",
  6: "grid-cols-3 grid-rows-2",
  9: "grid-cols-3 grid-rows-3",
};

export function VideoGrid() {
  const { streams, loading, error, reload } = useStreams();
  const hiddenIds = useStreamStore((s) => s.hiddenIds);
  const pageSize = useStreamStore((s) => s.pageSize);
  const page = useStreamStore((s) => s.page);
  const setPage = useStreamStore((s) => s.setPage);

  const visible = useMemo(
    () => streams.filter((s) => !hiddenIds.includes(s.id)),
    [streams, hiddenIds],
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pageCount - 1);

  useEffect(() => {
    if (page !== current) setPage(current);
  }, [page, current, setPage]);

  const items = visible.slice(current * pageSize, (current + 1) * pageSize);
  const emptySlots = Array.from(
    { length: pageSize - items.length },
    (_, i) => `slot-${current}-${items.length + i}`,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VideoToolbar
        visible={visible.length}
        hidden={streams.length - visible.length}
        page={current}
        pageCount={pageCount}
        onReload={() => void reload()}
      />

      {loading && streams.length === 0 ? (
        <ViewLoading label="Memuat daftar stream…" />
      ) : error && streams.length === 0 ? (
        <div className="grid-overlay flex flex-1 items-center justify-center">
          <EmptyState
            icon={VideoOff}
            title="Gagal memuat stream"
            description={error}
            action={<Button onClick={() => void reload()}>Coba lagi</Button>}
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="grid-overlay flex flex-1 items-center justify-center">
          <EmptyState
            icon={VideoOff}
            title={
              streams.length > 0
                ? "Semua stream disembunyikan"
                : "Belum ada stream"
            }
            description={
              streams.length > 0
                ? undefined
                : "Tambahkan sumber video pada halaman Drone."
            }
          />
        </div>
      ) : (
        <div
          className={cn(
            "grid min-h-0 flex-1 gap-px bg-border-subtle",
            GRID[pageSize],
          )}
        >
          {items.map((s) => (
            <StreamTile key={s.id} stream={s} />
          ))}
          {emptySlots.map((key) => (
            <div key={key} className="grid-overlay bg-gcs-root" />
          ))}
        </div>
      )}
    </div>
  );
}
