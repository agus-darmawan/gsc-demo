import { create } from "zustand";
import { distanceM } from "@/lib/geo";
import type { FlightSession, PathPoint } from "@/types/telemetry";

/** A gap longer than this closes the current track and starts a new one. */
export const SESSION_GAP_MS = 60_000;
const MAX_POINTS = 5_000;
const MAX_SESSIONS = 20;

const newSession = (droneId: string, p: PathPoint): FlightSession => ({
  id: `${droneId}-${p.t}`,
  droneId,
  startedAt: p.t,
  endedAt: p.t,
  distanceM: 0,
  points: [p],
});

const pushHistory = (list: FlightSession[] | undefined, s: FlightSession) =>
  s.points.length < 2
    ? (list ?? [])
    : [s, ...(list ?? [])].slice(0, MAX_SESSIONS);

interface PathState {
  /** Track being recorded right now, per drone. */
  current: Record<string, FlightSession>;
  /** Archived tracks (local + loaded from the backend), newest first. */
  history: Record<string, FlightSession[]>;
  historyLoaded: Record<string, boolean>;
  /** History session drawn on the map, per drone. */
  shown: Record<string, string | null>;

  append: (points: Record<string, PathPoint>) => void;
  archiveStale: (now?: number) => void;
  mergeHistory: (droneId: string, sessions: FlightSession[]) => void;
  showHistory: (droneId: string, sessionId: string | null) => void;
}

export const usePathStore = create<PathState>()((set) => ({
  current: {},
  history: {},
  historyLoaded: {},
  shown: {},

  append: (points) =>
    set((s) => {
      const current = { ...s.current };
      let history = s.history;

      for (const [id, p] of Object.entries(points)) {
        const cur = current[id];
        const last = cur?.points[cur.points.length - 1];
        if (cur && last && p.t - cur.endedAt <= SESSION_GAP_MS) {
          // Skip samples that did not move (parked vehicle).
          const moved = distanceM(last, p);
          if (moved < 0.5 && Math.abs((p.altM ?? 0) - (last.altM ?? 0)) < 0.3) {
            current[id] = { ...cur, endedAt: p.t };
            continue;
          }
          current[id] = {
            ...cur,
            endedAt: p.t,
            distanceM: cur.distanceM + moved,
            points:
              cur.points.length >= MAX_POINTS
                ? [...cur.points.slice(1), p]
                : [...cur.points, p],
          };
        } else {
          if (cur)
            history = { ...history, [id]: pushHistory(history[id], cur) };
          current[id] = newSession(id, p);
        }
      }
      return { current, history };
    }),

  archiveStale: (now = Date.now()) =>
    set((s) => {
      const stale = Object.values(s.current).filter(
        (c) => now - c.endedAt > SESSION_GAP_MS,
      );
      if (stale.length === 0) return s;

      let history = s.history;
      for (const c of stale) {
        history = {
          ...history,
          [c.droneId]: pushHistory(history[c.droneId], c),
        };
      }
      const staleIds = new Set(stale.map((c) => c.droneId));
      const current = Object.fromEntries(
        Object.entries(s.current).filter(([id]) => !staleIds.has(id)),
      );
      return { current, history };
    }),

  mergeHistory: (droneId, sessions) =>
    set((s) => {
      const known = new Set((s.history[droneId] ?? []).map((h) => h.id));
      const merged = [
        ...(s.history[droneId] ?? []),
        ...sessions.filter((h) => !known.has(h.id)),
      ]
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, MAX_SESSIONS);
      return {
        history: { ...s.history, [droneId]: merged },
        historyLoaded: { ...s.historyLoaded, [droneId]: true },
      };
    }),

  showHistory: (droneId, sessionId) =>
    set((s) => ({ shown: { ...s.shown, [droneId]: sessionId } })),
}));
