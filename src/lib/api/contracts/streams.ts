import type { Caption, DetectionFrame, Stream } from "@/types/stream";

export type Unsubscribe = () => void;

export interface StreamsApi {
  /** GET /streams (one per drone video source) */
  list(): Promise<Stream[]>;
  /** PUT /streams/:id/model { modelId } -> stream with a new playback URL */
  setModel(streamId: string, modelId: string | null): Promise<Stream>;
  /** PUT /streams/:id/models { modelIds } -> several models on one stream */
  setModels(streamId: string, modelIds: string[]): Promise<Stream>;
  /** POST /streams/focus { streamId } -> pause inference on other streams */
  setFocus(streamId: string | null): Promise<void>;
  /** GET /streams/:id/detections/latest */
  latestDetections(streamId: string): Promise<DetectionFrame | null>;
  /** SSE /streams/:id/captions -> realtime scene description */
  subscribeCaptions(
    streamId: string,
    onCaption: (caption: Caption) => void,
  ): Unsubscribe;
}
