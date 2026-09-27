import type { ModelFormat } from "@/types/model";

export const MODEL_ACCEPT = ".pt,.pth,.onnx,.engine,.trt,.zip";
export const MAX_MODEL_BYTES = 500 * 1024 * 1024;

const FORMAT_BY_EXTENSION: Record<string, ModelFormat> = {
  pt: "pytorch",
  pth: "pytorch",
  onnx: "onnx",
  engine: "tensorrt",
  trt: "tensorrt",
  zip: "coreml",
};

export function detectFormat(fileName: string): ModelFormat | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return FORMAT_BY_EXTENSION[extension] ?? null;
}

/** "yolov8s-visdrone_v2.pt" -> "yolov8s visdrone v2" */
export function defaultModelName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

/** Comma / newline separated class names, trimmed and de-duplicated. */
export function parseClasses(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[,\n]/)
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ];
}
