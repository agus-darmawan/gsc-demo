import type { Caption, DetectionFrame, Stream } from "@/types/stream";
import { currentToken, http } from "../client/http";
import { realtimeUrl } from "../client/realtime-url";
import type { StreamsApi } from "../contracts";

const path = (id: string) => `/streams/${encodeURIComponent(id)}`;

function isCaption(value: unknown): value is Caption {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.text === "string" && typeof v.timestamp === "number";
}

export const httpStreamsApi: StreamsApi = {
  async list() {
    const { data } = await http.get<Stream[]>("/streams");
    return data;
  },
  async setModel(streamId, modelId) {
    const { data } = await http.put<Stream>(`${path(streamId)}/model`, {
      modelId,
    });
    return data;
  },
  async setModels(streamId, modelIds) {
    const { data } = await http.put<Stream>(`${path(streamId)}/models`, {
      modelIds,
    });
    return data;
  },
  async setFocus(streamId) {
    await http.post("/streams/focus", { streamId });
  },
  async latestDetections(streamId) {
    const { data } = await http.get<DetectionFrame | null>(
      `${path(streamId)}/detections/latest`,
    );
    return data;
  },
  subscribeCaptions(streamId, onCaption) {
    const url = realtimeUrl(
      `${path(streamId)}/captions`,
      "sse",
      currentToken(),
    );
    const source = new EventSource(url);
    source.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed: unknown = JSON.parse(event.data);
        if (isCaption(parsed)) onCaption(parsed);
      } catch {
        /* ignore malformed events */
      }
    };
    return () => source.close();
  },
};
