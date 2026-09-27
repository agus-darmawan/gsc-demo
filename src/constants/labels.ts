import type {
  DroneStatus,
  DroneType,
  TelemetryProtocol,
  VideoProtocol,
} from "@/types/drone";
import type { DropAfterAction, DropStatus } from "@/types/drop";
import type { EventCategory, EventSeverity } from "@/types/event";
import type { CoordinateFormat } from "@/types/geo";
import type { MissionEndAction, WaypointAction } from "@/types/mission";
import type { ModelFormat, ModelStatus } from "@/types/model";
import type { SpeedUnit } from "@/types/settings";
import type { FlightMode, GpsFix } from "@/types/telemetry";

/** Operator-facing labels. All UI copy is Bahasa Indonesia. */

export const DRONE_STATUS_LABEL: Record<DroneStatus, string> = {
  airborne: "Terbang",
  returning: "Kembali",
  landed: "Siaga",
  lost: "Link putus",
  offline: "Offline",
  "video-only": "Video",
};

export const DRONE_TYPE_LABEL: Record<DroneType, string> = {
  multirotor: "Multirotor",
  vtol: "VTOL",
  "fixed-wing": "Sayap tetap",
};

export const FLIGHT_MODE_LABEL: Record<FlightMode, string> = {
  MANUAL: "Manual",
  STABILIZE: "Stabil",
  ALT_HOLD: "Tahan ketinggian",
  POSHOLD: "Tahan posisi",
  LOITER: "Loiter",
  GUIDED: "Terpandu",
  AUTO: "Misi otomatis",
  RTL: "Kembali ke home",
  LAND: "Mendarat",
};

export const GPS_FIX_LABEL: Record<GpsFix, string> = {
  none: "Tanpa fix",
  "2d": "2D",
  "3d": "3D",
  dgps: "DGPS",
  rtk: "RTK",
};

export const TELEMETRY_PROTOCOL_LABEL: Record<TelemetryProtocol, string> = {
  "mavlink-udp": "MAVLink UDP",
  "mavlink-tcp": "MAVLink TCP",
  "mavlink-serial": "MAVLink Serial",
  websocket: "WebSocket (bridge)",
};

export const VIDEO_PROTOCOL_LABEL: Record<VideoProtocol, string> = {
  rtmp: "RTMP",
  rtsp: "RTSP",
  webrtc: "WebRTC (WHEP)",
  hls: "HLS",
  srt: "SRT",
};

export const DROP_STATUS_LABEL: Record<DropStatus, string> = {
  draft: "Draf",
  queued: "Antre",
  enroute: "Menuju target",
  stabilizing: "Menstabilkan",
  released: "Payload dilepas",
  returning: "Kembali",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  failed: "Gagal",
};

export const DROP_AFTER_LABEL: Record<DropAfterAction, string> = {
  rtl: "Kembali ke home",
  hold: "Tahan di lokasi",
};

export const MISSION_END_LABEL: Record<MissionEndAction, string> = {
  rtl: "Kembali ke home",
  land: "Mendarat di titik akhir",
  hold: "Tahan di titik akhir",
};

export const WAYPOINT_ACTION_LABEL: Record<WaypointAction, string> = {
  none: "Lewati",
  hover: "Melayang",
  photo: "Ambil foto",
  release: "Lepas payload",
};

export const SEVERITY_LABEL: Record<EventSeverity, string> = {
  info: "Info",
  warning: "Peringatan",
  critical: "Kritis",
};

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  system: "Sistem",
  vehicle: "Wahana",
  mission: "Misi",
  payload: "Payload",
  link: "Link",
  ai: "AI",
};

export const MODEL_STATUS_LABEL: Record<ModelStatus, string> = {
  uploaded: "Siap dimuat",
  loading: "Memuat",
  loaded: "Aktif",
  failed: "Gagal",
};

export const MODEL_FORMAT_LABEL: Record<ModelFormat, string> = {
  pytorch: "PyTorch (.pt)",
  onnx: "ONNX (.onnx)",
  tensorrt: "TensorRT (.engine)",
  coreml: "CoreML",
};

export const COORDINATE_FORMAT_LABEL: Record<CoordinateFormat, string> = {
  dd: "Desimal (DD)",
  dms: "Derajat-menit-detik (DMS)",
  mgrs: "MGRS",
};

export const SPEED_UNIT_LABEL: Record<SpeedUnit, string> = {
  ms: "m/s",
  kmh: "km/jam",
  kn: "Knot",
};
