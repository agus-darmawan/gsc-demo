import { create } from "zustand";
import { api } from "@/lib/api";
import type { GcsEvent } from "@/types/event";

const MAX_EVENTS = 500;
const MAX_TOASTS = 4;

export type ToastTone = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  createdAt: number;
}

interface EventState {
  events: GcsEvent[];
  unread: number;
  loaded: boolean;
  toasts: Toast[];

  load: () => Promise<void>;
  ingest: (events: GcsEvent[]) => void;
  markAllRead: () => void;
  notify: (toast: Omit<Toast, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
}

let toastSeq = 0;

function toastFor(event: GcsEvent): Omit<Toast, "id" | "createdAt"> | null {
  if (event.severity === "critical")
    return { tone: "error", title: event.message };
  if (event.severity === "warning")
    return { tone: "warning", title: event.message };
  return null;
}

export const useEventStore = create<EventState>()((set, get) => ({
  events: [],
  unread: 0,
  loaded: false,
  toasts: [],

  load: async () => {
    if (get().loaded) return;
    try {
      const events = await api.events.list(200);
      set((s) => {
        const known = new Set(s.events.map((e) => e.id));
        const merged = [...s.events, ...events.filter((e) => !known.has(e.id))]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_EVENTS);
        return { events: merged, loaded: true };
      });
    } catch {
      set({ loaded: true });
    }
  },

  ingest: (incoming) => {
    if (incoming.length === 0) return;
    const newest = [...incoming].sort((a, b) => b.timestamp - a.timestamp);
    const toasts = newest.map(toastFor).filter((t) => t !== null);
    set((s) => ({
      events: [...newest, ...s.events].slice(0, MAX_EVENTS),
      unread: s.unread + incoming.length,
    }));
    for (const toast of toasts.slice(0, 2)) get().notify(toast);
  },

  markAllRead: () => set({ unread: 0 }),

  notify: (toast) => {
    toastSeq += 1;
    const entry: Toast = {
      ...toast,
      id: `toast-${toastSeq}`,
      createdAt: Date.now(),
    };
    set((s) => ({ toasts: [...s.toasts, entry].slice(-MAX_TOASTS) }));
  },

  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
