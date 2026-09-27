import type { TelemetryProtocol, VideoProtocol } from "@/types/drone";

const TELEMETRY_PATTERNS: Record<TelemetryProtocol, RegExp> = {
  "mavlink-udp": /^udp(in|out)?:\/\/[^\s:/]+:\d{2,5}$/i,
  "mavlink-tcp": /^tcp:\/\/[^\s:/]+:\d{2,5}$/i,
  "mavlink-serial": /^(serial:\/\/)?(\/dev\/[\w.-]+|COM\d+)(:\d{4,7})?$/i,
  websocket: /^wss?:\/\/[^\s]+$/i,
};

const VIDEO_PATTERNS: Record<VideoProtocol, RegExp> = {
  rtmp: /^rtmps?:\/\/[^\s]+$/i,
  rtsp: /^rtsps?:\/\/[^\s]+$/i,
  webrtc: /^https?:\/\/[^\s]+$/i,
  hls: /^https?:\/\/[^\s]+\.m3u8(\?[^\s]*)?$/i,
  srt: /^srt:\/\/[^\s]+$/i,
};

export const TELEMETRY_URL_EXAMPLE: Record<TelemetryProtocol, string> = {
  "mavlink-udp": "udp://0.0.0.0:14550",
  "mavlink-tcp": "tcp://192.168.1.10:5760",
  "mavlink-serial": "/dev/ttyUSB0:57600",
  websocket: "ws://192.168.1.20:3000/ws/drone",
};

export const VIDEO_URL_EXAMPLE: Record<VideoProtocol, string> = {
  rtmp: "rtmp://192.168.1.5/live/drone1",
  rtsp: "rtsp://192.168.1.5:8554/drone1",
  webrtc: "http://192.168.1.5:8889/drone1/whep",
  hls: "http://192.168.1.5:8888/drone1/index.m3u8",
  srt: "srt://192.168.1.5:8890?streamid=read:drone1",
};

export function isValidTelemetryUrl(
  protocol: TelemetryProtocol,
  url: string,
): boolean {
  return TELEMETRY_PATTERNS[protocol].test(url.trim());
}

export function isValidVideoUrl(protocol: VideoProtocol, url: string): boolean {
  return VIDEO_PATTERNS[protocol].test(url.trim());
}

export const DRONE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,39}$/;
