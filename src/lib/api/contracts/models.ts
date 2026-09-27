import type {
  DetectionModel,
  ModelUpdate,
  ModelUploadRequest,
  UploadProgress,
} from "@/types/model";

export interface ModelsApi {
  /** GET /models */
  list(): Promise<DetectionModel[]>;
  /** POST /models (multipart: file, name, description, classes) */
  upload(
    request: ModelUploadRequest,
    onProgress?: (progress: UploadProgress) => void,
    signal?: AbortSignal,
  ): Promise<DetectionModel>;
  /** PATCH /models/:id */
  update(id: string, patch: ModelUpdate): Promise<DetectionModel>;
  /** DELETE /models/:id */
  remove(id: string): Promise<void>;
  /** POST /models/:id/load -> loads the weights into the inference worker */
  load(id: string): Promise<DetectionModel>;
  /** POST /models/:id/unload */
  unload(id: string): Promise<DetectionModel>;
}
