import { currentToken } from "../client/http";
import { realtimeUrl } from "../client/realtime-url";
import type { RealtimeApi, RealtimeMessage } from "../contracts";

const MESSAGE_TYPES = new Set([
  "telemetry",
  "link",
  "event",
  "drop",
  "stream",
  "stream-removed",
]);
const MAX_BACKOFF_MS = 15_000;

function isRealtimeMessage(value: unknown): value is RealtimeMessage {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && MESSAGE_TYPES.has(type);
}

/**
 * WS /ws/realtime with automatic reconnect (exponential backoff).
 * The backend may batch messages by sending a JSON array.
 */
export const httpRealtimeApi: RealtimeApi = {
  connect(handlers) {
    let socket: WebSocket | null = null;
    let attempt = 0;
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const dispatch = (value: unknown) => {
      if (isRealtimeMessage(value)) handlers.onMessage(value);
    };

    const open = () => {
      if (stopped) return;
      handlers.onStatus("connecting");
      socket = new WebSocket(realtimeUrl("/ws/realtime", "ws", currentToken()));

      socket.onopen = () => {
        attempt = 0;
        handlers.onStatus("open");
      };
      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const parsed: unknown = JSON.parse(event.data);
          if (Array.isArray(parsed)) parsed.forEach(dispatch);
          else dispatch(parsed);
        } catch {
          /* ignore malformed frames */
        }
      };
      socket.onclose = () => {
        handlers.onStatus("closed");
        if (stopped) return;
        const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt);
        attempt += 1;
        retryTimer = setTimeout(open, delay + Math.random() * 400);
      };
      socket.onerror = () => socket?.close();
    };

    open();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  },
};
