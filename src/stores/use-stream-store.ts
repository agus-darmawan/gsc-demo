import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api, errorMessage } from "@/lib/api";
import type { Stream } from "@/types/stream";
import type { LoadStatus } from "./types";

export const PAGE_SIZES = [1, 4, 6, 9] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

interface StreamState {
  streams: Stream[];
  status: LoadStatus;
  error: string | null;

  /** Grid preferences (persisted). */
  hiddenIds: string[];
  pageSize: PageSize;
  page: number;

  load: (force?: boolean) => Promise<void>;
  /** Marks the list stale, e.g. after drone video sources change. */
  invalidate: () => void;
  updateStream: (stream: Stream) => void;
  /** Realtime upsert (online state, annotated URL, new sources). */
  upsertStream: (stream: Stream) => void;
  removeStream: (id: string) => void;
  hide: (id: string) => void;
  showAll: () => void;
  setPageSize: (size: PageSize) => void;
  setPage: (page: number) => void;
}

export const useStreamStore = create<StreamState>()(
  persist(
    (set, get) => ({
      streams: [],
      status: "idle",
      error: null,
      hiddenIds: [],
      pageSize: 4,
      page: 0,

      load: async (force = false) => {
        const { status } = get();
        if (status === "loading" || (status === "ready" && !force)) return;
        set({ status: "loading", error: null });
        try {
          const streams = await api.streams.list();
          set({ streams, status: "ready" });
        } catch (error) {
          set({ status: "error", error: errorMessage(error) });
        }
      },

      invalidate: () => set({ status: "idle" }),

      updateStream: (stream) =>
        set((s) => ({
          streams: s.streams.map((x) => (x.id === stream.id ? stream : x)),
        })),

      upsertStream: (stream) =>
        set((s) => {
          if (s.status !== "ready") return s;
          const exists = s.streams.some((x) => x.id === stream.id);
          return {
            streams: exists
              ? s.streams.map((x) => (x.id === stream.id ? stream : x))
              : [...s.streams, stream],
          };
        }),

      removeStream: (id) =>
        set((s) => ({ streams: s.streams.filter((x) => x.id !== id) })),

      hide: (id) =>
        set((s) =>
          s.hiddenIds.includes(id) ? s : { hiddenIds: [...s.hiddenIds, id] },
        ),
      showAll: () => set({ hiddenIds: [] }),
      setPageSize: (pageSize) => set({ pageSize, page: 0 }),
      setPage: (page) => set({ page: Math.max(0, page) }),
    }),
    {
      name: "pasupasastra.video-view",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ hiddenIds: s.hiddenIds, pageSize: s.pageSize }),
    },
  ),
);
