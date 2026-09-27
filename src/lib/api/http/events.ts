import type { GcsEvent } from "@/types/event";
import { http } from "../client/http";
import type { EventsApi } from "../contracts";

export const httpEventsApi: EventsApi = {
  async list(limit) {
    const { data } = await http.get<GcsEvent[]>("/events", {
      params: { limit },
    });
    return data;
  },
};
