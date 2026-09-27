import { sleep, uid } from "@/lib/utils";
import type { DetectionModel, ModelFormat } from "@/types/model";
import { ApiError } from "../client/errors";
import type { ModelsApi } from "../contracts";
import { clone, latency, readDb, updateDb } from "./db";

const FORMAT_BY_EXTENSION: Record<string, ModelFormat> = {
  zip: "coreml",
  pt: "pytorch",
  pth: "pytorch",
  onnx: "onnx",
  engine: "tensorrt",
  trt: "tensorrt",
};

function modelOrThrow(id: string): DetectionModel {
  const model = readDb().models.find((m) => m.id === id);
  if (!model) throw new ApiError("Model tidak ditemukan", 404);
  return model;
}

function patchModel(
  id: string,
  patch: Partial<DetectionModel>,
): DetectionModel {
  modelOrThrow(id);
  let result: DetectionModel | null = null;
  updateDb((db) => {
    const model = db.models.find((m) => m.id === id);
    if (!model) return;
    Object.assign(model, patch);
    result = clone(model);
  });
  if (!result) throw new ApiError("Model tidak ditemukan", 404);
  return result;
}

function uniqueKey(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "model";
  const taken = new Set(readDb().models.map((m) => m.key));
  let key = base;
  for (let n = 2; taken.has(key); n++) key = `${base}-${n}`;
  return key;
}

export const mockModelsApi: ModelsApi = {
  async list() {
    await latency();
    return clone(readDb().models);
  },

  async upload(request, onProgress, signal) {
    const extension = request.file.name.split(".").pop()?.toLowerCase() ?? "";
    const format = FORMAT_BY_EXTENSION[extension];
    if (!format) {
      throw new ApiError(
        "Format tidak didukung. Gunakan .pt, .onnx, .engine atau .mlpackage (zip)",
        422,
      );
    }
    const name = request.name.trim();
    if (
      readDb().models.some((m) => m.name.toLowerCase() === name.toLowerCase())
    ) {
      throw new ApiError(`Nama model "${name}" sudah dipakai`, 409);
    }

    const total = Math.max(1, request.file.size);
    const steps = 25;
    for (let i = 1; i <= steps; i++) {
      if (signal?.aborted)
        throw new ApiError("Unggahan dibatalkan", null, "cancelled");
      await sleep(70 + Math.random() * 80);
      const loaded = Math.round((total * i) / steps);
      onProgress?.({ loaded, total, percent: Math.round((i / steps) * 100) });
    }

    const model: DetectionModel = {
      id: uid("mdl"),
      name,
      key: uniqueKey(name),
      confidence: 0.35,
      everyN: 1,
      classFilter: [],
      color: "#39d0d8",
      description: request.description,
      fileName: request.file.name,
      fileSizeBytes: request.file.size,
      format,
      classes: request.classes.length > 0 ? request.classes : ["object"],
      inputSize: 640,
      status: "uploaded",
      error: null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: null,
    };
    updateDb((db) => {
      db.models.unshift(model);
    });
    return clone(model);
  },

  async update(id, patch) {
    await latency();
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new ApiError("Nama model wajib diisi", 422);
      const taken = readDb().models.some(
        (m) => m.id !== id && m.name.toLowerCase() === name.toLowerCase(),
      );
      if (taken) throw new ApiError(`Nama model "${name}" sudah dipakai`, 409);
    }
    return patchModel(id, patch);
  },

  async remove(id) {
    await latency();
    modelOrThrow(id);
    const inUse = Object.values(readDb().streamModels).some((ids) =>
      ids.includes(id),
    );
    if (inUse) {
      throw new ApiError(
        "Model sedang dipakai stream video. Lepaskan dulu dari stream.",
        409,
      );
    }
    updateDb((db) => {
      db.models = db.models.filter((m) => m.id !== id);
    });
  },

  async load(id) {
    const model = modelOrThrow(id);
    if (model.status === "loaded") return clone(model);
    const previousError = model.error;
    patchModel(id, { status: "loading", error: null });
    await sleep(1_400 + Math.random() * 800);
    if (model.format === "tensorrt" && previousError) {
      return patchModel(id, { status: "failed", error: previousError });
    }
    return patchModel(id, { status: "loaded", error: null });
  },

  async unload(id) {
    await latency(300);
    updateDb((db) => {
      for (const [streamId, ids] of Object.entries(db.streamModels)) {
        db.streamModels[streamId] = ids.filter((x) => x !== id);
      }
    });
    return patchModel(id, { status: "uploaded" });
  },
};
