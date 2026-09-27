export type DropStatus =
  | "draft"
  | "queued"
  | "enroute"
  | "stabilizing"
  | "released"
  | "returning"
  | "completed"
  | "cancelled"
  | "failed";

export type DropAfterAction = "rtl" | "hold";

export interface DropTarget {
  id: string;
  /** Human readable code, e.g. DRP-001. */
  code: string;
  lat: number;
  lon: number;
  dropAltM: number;
  approachSpeedMs: number;
  afterAction: DropAfterAction;
  droneId: string | null;
  status: DropStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DropTargetInput = Pick<
  DropTarget,
  | "lat"
  | "lon"
  | "dropAltM"
  | "approachSpeedMs"
  | "afterAction"
  | "droneId"
  | "note"
>;
