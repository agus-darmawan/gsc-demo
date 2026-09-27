import type { Camera, CameraInput } from "@/types/camera";

export interface CamerasApi {
  /** GET /cameras */
  list(): Promise<Camera[]>;
  /** POST /cameras */
  create(input: CameraInput): Promise<Camera>;
  /** PUT /cameras/:id */
  update(id: string, input: CameraInput): Promise<Camera>;
  /** DELETE /cameras/:id */
  remove(id: string): Promise<void>;
}
