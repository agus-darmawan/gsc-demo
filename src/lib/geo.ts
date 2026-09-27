import type { CoordinateFormat, LatLon } from "@/types/geo";
import { fromMgrs, toMgrs } from "./mgrs";

export const EARTH_RADIUS_M = 6_371_000;
export const M_PER_DEG_LAT = 111_320;

export const toRad = (deg: number): number => (deg * Math.PI) / 180;
export const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export function normalizeHeading(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Signed shortest angular difference b - a in degrees (-180..180]. */
export function headingDelta(a: number, b: number): number {
  const d = normalizeHeading(b - a);
  return d > 180 ? d - 360 : d;
}

/** Great-circle distance in meters. */
export function distanceM(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Initial bearing from a to b in degrees (0 = north, clockwise). */
export function bearingDeg(a: LatLon, b: LatLon): number {
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.cos(toRad(b.lon - a.lon));
  return normalizeHeading(toDeg(Math.atan2(y, x)));
}

/** Point reached from `origin` after `distance` meters on `bearing`. */
export function destination(
  origin: LatLon,
  bearing: number,
  distance: number,
): LatLon {
  const d = distance / EARTH_RADIUS_M;
  const brg = toRad(bearing);
  const lat1 = toRad(origin.lat);
  const lon1 = toRad(origin.lon);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brg),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brg) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: toDeg(lat2), lon: toDeg(lon2) };
}

/** Local flat-earth offset, accurate for short distances. */
export function offsetM(origin: LatLon, northM: number, eastM: number): LatLon {
  return {
    lat: origin.lat + northM / M_PER_DEG_LAT,
    lon: origin.lon + eastM / (M_PER_DEG_LAT * Math.cos(toRad(origin.lat))),
  };
}

/** Local east/north meters of `p` relative to `origin`. */
export function toLocalM(
  origin: LatLon,
  p: LatLon,
): { east: number; north: number } {
  return {
    east: (p.lon - origin.lon) * M_PER_DEG_LAT * Math.cos(toRad(origin.lat)),
    north: (p.lat - origin.lat) * M_PER_DEG_LAT,
  };
}

export function isValidLatLon(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function formatDmsPart(
  value: number,
  positive: string,
  negative: string,
): string {
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  const hemi = value >= 0 ? positive : negative;
  return `${d}°${m.toString().padStart(2, "0")}'${s.toFixed(1).padStart(4, "0")}"${hemi}`;
}

/** Operator-facing coordinate string in the selected format. */
export function formatLatLon(p: LatLon, format: CoordinateFormat): string {
  if (!isValidLatLon(p.lat, p.lon)) return "--";
  switch (format) {
    case "mgrs":
      return toMgrs(p.lat, p.lon) ?? "--";
    case "dms":
      return `${formatDmsPart(p.lat, "U", "S")} ${formatDmsPart(p.lon, "T", "B")}`;
    default:
      return `${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}`;
  }
}

/**
 * Accepts "-6.2088, 106.8456", "-6.2088 106.8456" or an MGRS reference.
 * Returns null when the text cannot be interpreted.
 */
export function parseLatLon(text: string): LatLon | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const pair = trimmed.match(
    /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/,
  );
  if (pair?.[1] && pair[2]) {
    const lat = Number(pair[1]);
    const lon = Number(pair[2]);
    return isValidLatLon(lat, lon) ? { lat, lon } : null;
  }
  return fromMgrs(trimmed);
}
