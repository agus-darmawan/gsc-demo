import type { Camera } from "@/types/camera";
import { ApiError } from "../client/errors";
import type { CamerasApi } from "../contracts";
import { clone, latency, readDb, updateDb } from "./db";

export const mockCamerasApi: CamerasApi = {
  async list() {
    await latency();
    return clone(readDb().cameras);
  },

  async create(input) {
    await latency(200);
    if (readDb().cameras.some((c) => c.id === input.id)) {
      throw new ApiError(`ID kamera "${input.id}" sudah terdaftar`, 409);
    }
    const now = new Date().toISOString();
    const camera: Camera = { ...input, createdAt: now, updatedAt: now };
    updateDb((db) => {
      db.cameras.push(camera);
    });
    return clone(camera);
  },

  async update(id, input) {
    await latency(200);
    const existing = readDb().cameras.find((c) => c.id === id);
    if (!existing) throw new ApiError("Kamera tidak ditemukan", 404);
    const camera: Camera = {
      ...existing,
      ...input,
      id,
      updatedAt: new Date().toISOString(),
    };
    updateDb((db) => {
      db.cameras = db.cameras.map((c) => (c.id === id ? camera : c));
    });
    return clone(camera);
  },

  async remove(id) {
    await latency();
    updateDb((db) => {
      db.cameras = db.cameras.filter((c) => c.id !== id);
      delete db.streamModels[`cam.${id}`];
    });
  },
};
