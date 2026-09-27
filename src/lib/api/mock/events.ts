import type { EventsApi } from "../contracts";
import { latency } from "./db";
import { simEngine } from "./engine";

export const mockEventsApi: EventsApi = {
  async list(limit) {
    await latency();
    return simEngine().recentEvents(limit);
  },
};
