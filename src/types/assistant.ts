import type { Caption, Detection, DetectionFrame } from "./stream";

/** Frame plus AI context captured at the same moment, sent to the VLM. */
export interface FrameSnapshot {
  image: string;
  takenAt: number;
  detections: DetectionFrame | null;
  caption: Caption | null;
}

export type ChatRole = "user" | "assistant";
export type InputMode = "text" | "voice";

export interface VlmMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
  inputMode?: InputMode;
  snapshot?: FrameSnapshot;
  pending?: boolean;
  error?: boolean;
}

export interface VlmAskRequest {
  streamId: string;
  question: string;
  image: string;
  detections: Detection[];
  caption: string | null;
  history: { role: ChatRole; text: string }[];
}

export interface VlmAskResponse {
  answer: string;
}

export type SttEngine = "browser" | "server";
export type SttLanguage = "id-ID" | "en-US";

export interface SttResult {
  text: string;
  language: SttLanguage;
  confidence: number | null;
}
