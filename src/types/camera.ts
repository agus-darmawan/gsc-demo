import type { VideoProtocol } from "./drone";

/** Fixed video source that is not a drone: CCTV, a phone streaming RTMP, etc. */
export interface Camera {
  id: string;
  name: string;
  protocol: VideoProtocol;
  url: string;
  lat: number | null;
  lon: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CameraInput = Omit<Camera, "createdAt" | "updatedAt">;
