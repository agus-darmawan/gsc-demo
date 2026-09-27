import { DEFAULT_FLIGHT_PARAMS } from "@/constants/defaults";
import { uid } from "@/lib/utils";
import {
  DRONE_ID_PATTERN,
  isValidTelemetryUrl,
  isValidVideoUrl,
} from "@/lib/validators";
import type {
  Drone,
  DroneInput,
  DroneType,
  TelemetryProtocol,
  VideoProtocol,
} from "@/types/drone";

export interface VideoSourceForm {
  /** Stable React key; `id` may be empty until saved. */
  key: string;
  id: string;
  name: string;
  protocol: VideoProtocol;
  url: string;
  primary: boolean;
}

export interface DroneFormValues {
  id: string;
  callsign: string;
  model: string;
  type: DroneType;
  serialNumber: string;
  notes: string;
  /** Simulated drone for demo features. */
  demo: boolean;
  telemetryEnabled: boolean;
  telemetryProtocol: TelemetryProtocol;
  telemetryUrl: string;
  systemId: string;
  videoSources: VideoSourceForm[];
  rtlAltM: string;
  maxAltM: string;
  cruiseSpeedMs: string;
  lowBatteryPct: string;
}

/** Error messages keyed by field ("callsign", "video.<key>.url", ...). */
export type DroneFormErrors = Record<string, string>;

export function newVideoSource(primary: boolean): VideoSourceForm {
  return {
    key: uid("vs"),
    id: "",
    name: primary ? "Kamera utama" : "",
    protocol: "rtmp",
    url: "",
    primary,
  };
}

export function emptyDroneForm(): DroneFormValues {
  return {
    id: "",
    callsign: "",
    model: "",
    type: "multirotor",
    serialNumber: "",
    notes: "",
    demo: false,
    telemetryEnabled: true,
    telemetryProtocol: "websocket",
    telemetryUrl: "",
    systemId: "1",
    videoSources: [newVideoSource(true)],
    rtlAltM: String(DEFAULT_FLIGHT_PARAMS.rtlAltM),
    maxAltM: String(DEFAULT_FLIGHT_PARAMS.maxAltM),
    cruiseSpeedMs: String(DEFAULT_FLIGHT_PARAMS.cruiseSpeedMs),
    lowBatteryPct: String(DEFAULT_FLIGHT_PARAMS.lowBatteryPct),
  };
}

export function droneToForm(d: Drone): DroneFormValues {
  return {
    id: d.id,
    callsign: d.callsign,
    model: d.model,
    type: d.type,
    serialNumber: d.serialNumber ?? "",
    notes: d.notes ?? "",
    demo: d.demo,
    telemetryEnabled: d.telemetry.enabled,
    telemetryProtocol: d.telemetry.protocol,
    telemetryUrl: d.telemetry.url,
    systemId: d.telemetry.systemId === null ? "" : String(d.telemetry.systemId),
    videoSources: d.videoSources.map((v) => ({ ...v, key: uid("vs") })),
    rtlAltM: String(d.params.rtlAltM),
    maxAltM: String(d.params.maxAltM),
    cruiseSpeedMs: String(d.params.cruiseSpeedMs),
    lowBatteryPct: String(d.params.lowBatteryPct),
  };
}

const num = (s: string) => Number(s.trim().replace(",", "."));
const isMavlink = (p: TelemetryProtocol) => p.startsWith("mavlink");

function checkRange(
  errors: DroneFormErrors,
  key: string,
  value: string,
  min: number,
  max: number,
  unit: string,
) {
  const n = num(value);
  if (!value.trim() || !Number.isFinite(n)) errors[key] = "Wajib diisi angka";
  else if (n < min || n > max) errors[key] = `Antara ${min} dan ${max} ${unit}`;
}

export function validateDroneForm(
  v: DroneFormValues,
  options: { isNew: boolean; existingIds: readonly string[] },
): DroneFormErrors {
  const errors: DroneFormErrors = {};

  if (options.isNew) {
    if (!DRONE_ID_PATTERN.test(v.id)) {
      errors.id =
        "3–40 karakter: huruf kecil, angka, - atau _ (diawali huruf/angka)";
    } else if (options.existingIds.includes(v.id)) {
      errors.id = "ID sudah dipakai drone lain";
    }
  }
  if (!v.callsign.trim()) errors.callsign = "Callsign wajib diisi";
  else if (v.callsign.trim().length > 24)
    errors.callsign = "Maksimal 24 karakter";
  if (!v.model.trim()) errors.model = "Model wajib diisi";

  // Bridges connect to the server themselves, so a WebSocket URL is optional.
  const urlOptional =
    v.telemetryProtocol === "websocket" && !v.telemetryUrl.trim();
  if (v.telemetryEnabled && !v.demo) {
    if (
      !urlOptional &&
      !isValidTelemetryUrl(v.telemetryProtocol, v.telemetryUrl)
    ) {
      errors.telemetryUrl = "Alamat tidak sesuai dengan protokol yang dipilih";
    }
    if (isMavlink(v.telemetryProtocol) && v.systemId.trim()) {
      const id = num(v.systemId);
      if (!Number.isInteger(id) || id < 1 || id > 255)
        errors.systemId = "1–255";
    }
  }

  const names = new Set<string>();
  for (const source of v.videoSources) {
    const name = source.name.trim().toLowerCase();
    if (!name) errors[`video.${source.key}.name`] = "Nama wajib diisi";
    else if (names.has(name))
      errors[`video.${source.key}.name`] = "Nama sumber harus unik";
    names.add(name);
    if (!isValidVideoUrl(source.protocol, source.url)) {
      errors[`video.${source.key}.url`] = "URL tidak sesuai dengan protokol";
    }
  }
  if (!v.demo && !v.telemetryEnabled && v.videoSources.length === 0) {
    errors.capabilities =
      "Aktifkan telemetri atau tambahkan minimal satu sumber video";
  }

  checkRange(errors, "rtlAltM", v.rtlAltM, 10, 500, "m");
  checkRange(errors, "maxAltM", v.maxAltM, 20, 1000, "m");
  checkRange(errors, "cruiseSpeedMs", v.cruiseSpeedMs, 1, 30, "m/s");
  checkRange(errors, "lowBatteryPct", v.lowBatteryPct, 10, 50, "%");
  if (!errors.rtlAltM && !errors.maxAltM && num(v.rtlAltM) > num(v.maxAltM)) {
    errors.rtlAltM = "Tidak boleh melebihi ketinggian maksimum";
  }
  return errors;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

/** Converts form values to the API payload (assign ids, one primary source). */
export function formToInput(v: DroneFormValues): DroneInput {
  const used = new Set<string>();
  const sources = v.videoSources.map((s, index) => {
    let id = s.id || slug(s.name) || `src-${index + 1}`;
    while (used.has(id)) id = `${id}-${index + 1}`;
    used.add(id);
    return {
      id,
      name: s.name.trim(),
      protocol: s.protocol,
      url: s.url.trim(),
      primary: s.primary,
    };
  });
  if (sources.length > 0 && !sources.some((s) => s.primary)) {
    const first = sources[0];
    if (first) first.primary = true;
  }

  return {
    id: v.id.trim(),
    callsign: v.callsign.trim().toUpperCase(),
    model: v.model.trim(),
    type: v.type,
    serialNumber: v.serialNumber.trim() || null,
    notes: v.notes.trim() || null,
    demo: v.demo,
    telemetry: v.demo
      ? { enabled: true, protocol: "websocket", url: "", systemId: null }
      : {
          enabled: v.telemetryEnabled,
          protocol: v.telemetryProtocol,
          url: v.telemetryUrl.trim(),
          systemId:
            isMavlink(v.telemetryProtocol) && v.systemId.trim()
              ? num(v.systemId)
              : null,
        },
    videoSources: sources,
    params: {
      rtlAltM: num(v.rtlAltM),
      maxAltM: num(v.maxAltM),
      cruiseSpeedMs: num(v.cruiseSpeedMs),
      lowBatteryPct: num(v.lowBatteryPct),
    },
  };
}
