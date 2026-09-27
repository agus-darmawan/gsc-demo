import type { RealtimeApi } from "../contracts";
import { simEngine } from "./engine";

export const mockRealtimeApi: RealtimeApi = {
  connect(handlers) {
    handlers.onStatus("connecting");
    let unsubscribe: (() => void) | null = null;
    const timer = setTimeout(() => {
      unsubscribe = simEngine().subscribe(handlers.onMessage);
      handlers.onStatus("open");
    }, 350);

    return () => {
      clearTimeout(timer);
      unsubscribe?.();
      handlers.onStatus("closed");
    };
  },
};
