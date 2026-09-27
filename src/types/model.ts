export type ModelFormat = "pytorch" | "onnx" | "tensorrt" | "coreml";
export type ModelStatus = "uploaded" | "loading" | "loaded" | "failed";

/** Object detection weights stored by the backend inference service. */
export interface DetectionModel {
  id: string;
  name: string;
  /** Short unique name used in "model:class" counts. */
  key: string;
  description: string | null;
  fileName: string;
  fileSizeBytes: number;
  format: ModelFormat;
  classes: string[];
  inputSize: number | null;
  confidence: number;
  /** Runs on every Nth frame, reusing its last result in between. */
  everyN: number;
  /** Class names kept from the model output; empty = all. */
  classFilter: string[];
  /** Box color "#rrggbb" in the annotated video. */
  color: string;
  status: ModelStatus;
  error: string | null;
  uploadedAt: string;
  uploadedBy: string | null;
}

export interface ModelUploadRequest {
  file: File;
  name: string;
  description: string | null;
  classes: string[];
}

export interface ModelUpdate {
  name?: string;
  description?: string | null;
  classes?: string[];
  confidence?: number;
  everyN?: number;
  classFilter?: string[];
  color?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}
