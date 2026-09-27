/**
 * WGS84 lat/lon <-> UTM <-> MGRS conversion (military grid reference).
 * Valid between 80°S and 84°N; returns null outside that range.
 */

const A = 6_378_137;
const F = 1 / 298.257223563;
const K0 = 0.9996;
const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);

const BAND_LETTERS = "CDEFGHJKLMNPQRSTUVWX";
const COLUMN_SETS = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"];
const ROW_LETTERS = "ABCDEFGHJKLMNPQRSTUV";

/** Minimum northing (m) of each latitude band, used to resolve row cycles. */
const BAND_MIN_NORTHING: Record<string, number> = {
  C: 1_100_000,
  D: 2_000_000,
  E: 2_800_000,
  F: 3_700_000,
  G: 4_600_000,
  H: 5_500_000,
  J: 6_400_000,
  K: 7_300_000,
  L: 8_200_000,
  M: 9_100_000,
  N: 0,
  P: 800_000,
  Q: 1_700_000,
  R: 2_600_000,
  S: 3_500_000,
  T: 4_400_000,
  U: 5_300_000,
  V: 6_200_000,
  W: 7_000_000,
  X: 7_900_000,
};

export interface Utm {
  zone: number;
  band: string;
  easting: number;
  northing: number;
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function utmZone(lat: number, lon: number): number {
  let zone = Math.floor((lon + 180) / 6) + 1;
  if (zone > 60) zone = 60;
  // Norway / Svalbard exceptions.
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
  if (lat >= 72 && lat < 84) {
    if (lon >= 0 && lon < 9) zone = 31;
    else if (lon >= 9 && lon < 21) zone = 33;
    else if (lon >= 21 && lon < 33) zone = 35;
    else if (lon >= 33 && lon < 42) zone = 37;
  }
  return zone;
}

function bandLetter(lat: number): string {
  if (lat >= 72) return "X";
  return BAND_LETTERS[Math.floor((lat + 80) / 8)] ?? "X";
}

function meridionalArc(phi: number): number {
  return (
    A *
    ((1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256) * phi -
      ((3 * E2) / 8 + (3 * E2 ** 2) / 32 + (45 * E2 ** 3) / 1024) *
        Math.sin(2 * phi) +
      ((15 * E2 ** 2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * E2 ** 3) / 3072) * Math.sin(6 * phi))
  );
}

export function toUtm(lat: number, lon: number): Utm | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -80 || lat > 84) return null;

  const zone = utmZone(lat, lon);
  const lon0 = rad((zone - 1) * 6 - 180 + 3);
  const phi = rad(lat);
  const n = A / Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
  const t = Math.tan(phi) ** 2;
  const c = EP2 * Math.cos(phi) ** 2;
  const a = Math.cos(phi) * (rad(lon) - lon0);
  const m = meridionalArc(phi);

  const easting =
    K0 *
      n *
      (a +
        ((1 - t + c) * a ** 3) / 6 +
        ((5 - 18 * t + t ** 2 + 72 * c - 58 * EP2) * a ** 5) / 120) +
    500_000;

  let northing =
    K0 *
    (m +
      n *
        Math.tan(phi) *
        (a ** 2 / 2 +
          ((5 - t + 9 * c + 4 * c ** 2) * a ** 4) / 24 +
          ((61 - 58 * t + t ** 2 + 600 * c - 330 * EP2) * a ** 6) / 720));
  if (lat < 0) northing += 10_000_000;

  return { zone, band: bandLetter(lat), easting, northing };
}

export function fromUtm(utm: Utm): { lat: number; lon: number } {
  const southern = BAND_LETTERS.indexOf(utm.band) < BAND_LETTERS.indexOf("N");
  const x = utm.easting - 500_000;
  const y = southern ? utm.northing - 10_000_000 : utm.northing;
  const lon0 = rad((utm.zone - 1) * 6 - 180 + 3);

  const m = y / K0;
  const mu = m / (A * (1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256));
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sin1 = Math.sin(phi1);
  const cos1 = Math.cos(phi1);
  const tan1 = Math.tan(phi1);
  const n1 = A / Math.sqrt(1 - E2 * sin1 ** 2);
  const t1 = tan1 ** 2;
  const c1 = EP2 * cos1 ** 2;
  const r1 = (A * (1 - E2)) / (1 - E2 * sin1 ** 2) ** 1.5;
  const d = x / (n1 * K0);

  const lat =
    phi1 -
    ((n1 * tan1) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * EP2) * d ** 4) / 24 +
        ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * EP2 - 3 * c1 ** 2) *
          d ** 6) /
          720);
  const lon =
    lon0 +
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * EP2 + 24 * t1 ** 2) * d ** 5) /
        120) /
      cos1;

  return { lat: deg(lat), lon: deg(lon) };
}

/** Formats a position as MGRS, e.g. "48M YU 03512 16989". */
export function toMgrs(lat: number, lon: number, precision = 5): string | null {
  const utm = toUtm(lat, lon);
  if (!utm) return null;

  const set = ((utm.zone - 1) % 3) as 0 | 1 | 2;
  const columns = COLUMN_SETS[set] ?? COLUMN_SETS[0];
  const col = columns.charAt(Math.floor(utm.easting / 100_000) - 1);

  let row = Math.floor(utm.northing / 100_000) % 20;
  if (utm.zone % 2 === 0) row = (row + 5) % 20;
  const rowLetter = ROW_LETTERS.charAt(row);

  const digits = Math.max(1, Math.min(5, precision));
  const divisor = 10 ** (5 - digits);
  const e = Math.floor((utm.easting % 100_000) / divisor)
    .toString()
    .padStart(digits, "0");
  const n = Math.floor((utm.northing % 100_000) / divisor)
    .toString()
    .padStart(digits, "0");

  return `${utm.zone}${utm.band} ${col}${rowLetter} ${e} ${n}`;
}

const MGRS_PATTERN = /^(\d{1,2})([C-HJ-NP-X])([A-HJ-NP-Z])([A-HJ-NP-V])(\d*)$/;

/** Parses an MGRS string (spaces optional). Returns the center of the cell. */
export function fromMgrs(input: string): { lat: number; lon: number } | null {
  const match = input.toUpperCase().replace(/\s+/g, "").match(MGRS_PATTERN);
  if (!match) return null;

  const [, zoneStr, band, colLetter, rowLetter, numeric] = match;
  if (!zoneStr || !band || !colLetter || !rowLetter || numeric === undefined)
    return null;
  if (numeric.length % 2 !== 0 || numeric.length > 10) return null;

  const zone = Number(zoneStr);
  if (zone < 1 || zone > 60) return null;

  const set = (zone - 1) % 3;
  const colIndex = (COLUMN_SETS[set] ?? "").indexOf(colLetter);
  let rowIndex = ROW_LETTERS.indexOf(rowLetter);
  if (colIndex < 0 || rowIndex < 0) return null;
  if (zone % 2 === 0) rowIndex = (rowIndex - 5 + 20) % 20;

  const half = numeric.length / 2;
  const cell = 10 ** (5 - half);
  const e = half === 0 ? 0 : Number(numeric.slice(0, half)) * cell;
  const n = half === 0 ? 0 : Number(numeric.slice(half)) * cell;

  const easting = (colIndex + 1) * 100_000 + e + cell / 2;
  let northing = rowIndex * 100_000 + n + cell / 2;
  const minNorthing = BAND_MIN_NORTHING[band] ?? 0;
  while (northing < minNorthing) northing += 2_000_000;

  return fromUtm({ zone, band, easting, northing });
}
