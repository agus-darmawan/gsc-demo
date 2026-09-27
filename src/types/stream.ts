import type { VideoProtocol } from "./drone";

/** A playable video feed, one per drone video source. */
export interface Stream {
  id: string;
  droneId: string | null;
  /** Fixed camera (CCTV / phone) when the stream does not belong to a drone. */
  cameraId: string | null;
  sourceId: string | null;
  name: string;
  protocol: VideoProtocol;
  /** Browser playback URL (WHEP / file). Changes when the model changes. */
  url: string;
  /** First detection model (kept for compatibility), null = raw feed. */
  modelId: string | null;
  /** Detection models running together on this stream. */
  modelIds: string[];
  online: boolean;
  /** Playback URL already carries boxes drawn by the inference worker. */
  annotated: boolean;
  hlsUrl: string;
  path: string;
}

export interface Detection {
  /** Key of the model that produced it. */
  model?: string | null;
  label: string;
  confidence: number;
  /** Normalized [x1, y1, x2, y2] (0..1). */
  bbox: [number, number, number, number];
  trackId?: number | null;
}

export interface DetectionFrame {
  streamId: string;
  modelId: string | null;
  modelIds?: string[];
  timestamp: number;
  detections: Detection[];
  /** Cross-model counts from the worker's COUNT_GROUPS, e.g. { orang: 12 }. */
  groups?: Record<string, number>;
  timingsMs?: Record<string, number>;
}

export interface Caption {
  streamId: string;
  timestamp: number;
  text: string;
  prompt?: string;
  textOriginal?: string;
}
