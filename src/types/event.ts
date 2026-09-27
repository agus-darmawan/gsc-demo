export type EventSeverity = "info" | "warning" | "critical";

export type EventCategory =
  | "system"
  | "vehicle"
  | "mission"
  | "payload"
  | "link"
  | "ai";

export interface GcsEvent {
  id: string;
  timestamp: number;
  severity: EventSeverity;
  category: EventCategory;
  droneId: string | null;
  message: string;
}
