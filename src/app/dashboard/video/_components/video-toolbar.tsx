"use client";

import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PAGE_SIZES, useStreamStore } from "@/stores/use-stream-store";

interface VideoToolbarProps {
  visible: number;
  hidden: number;
  page: number;
  pageCount: number;
  onReload: () => void;
}

export function VideoToolbar({
  visible,
  hidden,
  page,
  pageCount,
  onReload,
}: VideoToolbarProps) {
  const pageSize = useStreamStore((s) => s.pageSize);
  const setPageSize = useStreamStore((s) => s.setPageSize);
  const setPage = useStreamStore((s) => s.setPage);
  const showAll = useStreamStore((s) => s.showAll);

  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border-subtle bg-gcs-primary px-3">
      <span className="text-xs text-txt-secondary">{visible} stream</span>
      {hidden > 0 && (
        <button
          type="button"
          onClick={showAll}
          className="flex items-center gap-1 text-[11px] text-txt-tertiary hover:text-cyan"
        >
          <Eye size={12} aria-hidden />
          {hidden} disembunyikan, tampilkan semua
        </button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <IconButton
          size="xs"
          variant="ghost"
          icon={RefreshCw}
          label="Muat ulang daftar stream"
          onClick={onReload}
        />
        <span className="mr-1 ml-2 text-[11px] text-txt-tertiary">
          Tata letak
        </span>
        {PAGE_SIZES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPageSize(n)}
            aria-pressed={pageSize === n}
            className={cn(
              "min-w-6 border px-1.5 py-0.5 font-mono text-[10px] font-bold transition-colors",
              pageSize === n
                ? "border-cyan/60 bg-cyan/15 text-cyan"
                : "border-border-subtle text-txt-muted hover:text-txt-secondary",
            )}
          >
            {n}
          </button>
        ))}
        {pageCount > 1 && (
          <>
            <span className="mx-1 h-4 w-px bg-border-subtle" aria-hidden />
            <IconButton
              size="xs"
              variant="ghost"
              icon={ChevronLeft}
              label="Halaman sebelumnya"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            />
            <span className="px-1 font-mono text-[10px] tabular-nums text-txt-secondary">
              {page + 1}/{pageCount}
            </span>
            <IconButton
              size="xs"
              variant="ghost"
              icon={ChevronRight}
              label="Halaman berikutnya"
              disabled={page >= pageCount - 1}
              onClick={() => setPage(page + 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}
