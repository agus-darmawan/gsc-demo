import type { SpeedUnit } from "@/types/settings";
import { isValidNumber } from "./utils";

const LOCALE = "id-ID";

export function formatDuration(
  totalSeconds: number | null | undefined,
): string {
  if (!isValidNumber(totalSeconds)) return "--:--";
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = sec.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDistance(m: number | null | undefined): string {
  if (!isValidNumber(m)) return "--";
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

export function formatAltitude(m: number | null | undefined): string {
  if (!isValidNumber(m)) return "--";
  return `${m.toFixed(1)} m`;
}

const SPEED_FACTOR: Record<SpeedUnit, number> = {
  ms: 1,
  kmh: 3.6,
  kn: 1.943844,
};
const SPEED_SUFFIX: Record<SpeedUnit, string> = {
  ms: "m/s",
  kmh: "km/j",
  kn: "kn",
};

export function formatSpeed(
  ms: number | null | undefined,
  unit: SpeedUnit = "ms",
): string {
  if (!isValidNumber(ms)) return "--";
  return `${(ms * SPEED_FACTOR[unit]).toFixed(1)} ${SPEED_SUFFIX[unit]}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (!isValidNumber(value)) return "--";
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

export function formatBytes(bytes: number): string {
  if (!isValidNumber(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString(LOCALE, { hour12: false });
}

export function formatDateTime(value: number | string): string {
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Compact relative time, e.g. "12 dtk lalu". */
export function formatAgo(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s} dtk lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

/** Human duration from milliseconds, e.g. "1 jam 20 mnt". */
export function formatSpan(ms: number): string {
  if (!isValidNumber(ms)) return "--";
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} jam ${m} mnt`;
  if (m > 0) return `${m} mnt ${sec} dtk`;
  return `${sec} dtk`;
}

/** Date and time with seconds, e.g. "25 Sep 2026 14.03.22". */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
