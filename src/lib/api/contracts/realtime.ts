import type { DropTarget } from "@/types/drop";
import type { GcsEvent } from "@/types/event";
import type { Stream } from "@/types/stream";
import type {
  DroneCapability,
  DroneTelemetry,
  LinkState,
} from "@/types/telemetry";
import type { Unsubscribe } from "./streams";

/** Messages pushed by the backend on WS /ws/realtime. */
export type RealtimeMessage =
  | { type: "telemetry"; droneId: string; data: DroneTelemetry }
  | {
      type: "link";
      droneId: string;
      link: LinkState;
      capabilities?: DroneCapability[];
      bridge?: string | null;
    }
  | { type: "event"; event: GcsEvent }
  | { type: "drop"; target: DropTarget }
  | { type: "stream"; stream: Stream }
  | { type: "stream-removed"; streamId: string };

export type RealtimeStatus = "connecting" | "open" | "closed";

export interface RealtimeHandlers {
  onMessage(message: RealtimeMessage): void;
  onStatus(status: RealtimeStatus): void;
}

export interface RealtimeApi {
  connect(handlers: RealtimeHandlers): Unsubscribe;
}
