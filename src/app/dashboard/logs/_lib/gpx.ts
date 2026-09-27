import type { FlightSession } from "@/types/telemetry";

const escapeXml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** GPX 1.1 track, readable by QGIS, Google Earth and most GIS tools. */
export function toGpx(session: FlightSession, name: string): string {
  const points = session.points
    .map(
      (p) =>
        `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}"><ele>${(p.altM ?? 0).toFixed(1)}</ele><time>${new Date(p.t).toISOString()}</time></trkpt>`,
    )
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="pasupasastra GCS" xmlns="http://www.topografix.com/GPX/1/1">',
    `  <trk><name>${escapeXml(name)}</name>`,
    "    <trkseg>",
    points,
    "    </trkseg>",
    "  </trk>",
    "</gpx>",
    "",
  ].join("\n");
}
