import type { GcsEvent } from "@/types/event";

export interface EventsApi {
  /** GET /events?limit= */
  list(limit: number): Promise<GcsEvent[]>;
}
