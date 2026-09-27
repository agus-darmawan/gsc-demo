import { uid } from "@/lib/utils";
import type { DropStatus, DropTarget } from "@/types/drop";
import { ApiError } from "../client/errors";
import type { DropsApi } from "../contracts";
import { clone, latency, readDb, updateDb } from "./db";
import { simEngine } from "./engine";

const ACTIVE: ReadonlySet<DropStatus> = new Set([
  "queued",
  "enroute",
  "stabilizing",
  "released",
  "returning",
]);

function targetOrThrow(id: string): DropTarget {
  const target = readDb().drops.find((d) => d.id === id);
  if (!target) throw new ApiError("Target tidak ditemukan", 404);
  return target;
}

function setStatus(id: string, status: DropStatus): DropTarget {
  let result: DropTarget | null = null;
  updateDb((db) => {
    const target = db.drops.find((d) => d.id === id);
    if (!target) return;
    target.status = status;
    target.updatedAt = new Date().toISOString();
    result = clone(target);
  });
  if (!result) throw new ApiError("Target tidak ditemukan", 404);
  return result;
}

export const mockDropsApi: DropsApi = {
  async list() {
    await latency();
    simEngine();
    return clone(readDb().drops);
  },

  async create(input) {
    await latency(150);
    const now = new Date().toISOString();
    let created: DropTarget | null = null;
    updateDb((db) => {
      db.dropSequence += 1;
      created = {
        ...clone(input),
        id: uid("drp"),
        code: `DRP-${db.dropSequence.toString().padStart(3, "0")}`,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };
      db.drops.push(created);
    });
    if (!created) throw new ApiError("Gagal membuat target", 500);
    return clone(created);
  },

  async update(id, input) {
    await latency(150);
    if (ACTIVE.has(targetOrThrow(id).status)) {
      throw new ApiError("Target sedang dijalankan dan tidak bisa diubah", 409);
    }
    let updated: DropTarget | null = null;
    updateDb((db) => {
      const target = db.drops.find((d) => d.id === id);
      if (!target) return;
      Object.assign(target, clone(input), {
        status: "draft",
        updatedAt: new Date().toISOString(),
      });
      updated = clone(target);
    });
    if (!updated) throw new ApiError("Target tidak ditemukan", 404);
    return updated;
  },

  async remove(id) {
    await latency();
    if (ACTIVE.has(targetOrThrow(id).status)) {
      throw new ApiError("Batalkan target terlebih dahulu", 409);
    }
    updateDb((db) => {
      db.drops = db.drops.filter((d) => d.id !== id);
    });
  },

  async execute(id) {
    await latency(300);
    const target = targetOrThrow(id);
    if (ACTIVE.has(target.status))
      throw new ApiError("Target sudah berjalan", 409);
    if (!target.droneId)
      throw new ApiError("Pilih drone untuk target ini", 422);

    const drone = readDb().drones.find((d) => d.id === target.droneId);
    if (!drone) throw new ApiError("Drone tidak ditemukan", 404);
    if (!drone.demo) {
      throw new ApiError(
        "Eksekusi drop hanya tersedia pada drone demo. Drone nyata memerlukan integrasi payload khusus; lokasi target tetap tersimpan dan tampil di peta.",
        409,
      );
    }

    setStatus(id, "queued");
    const ack = simEngine().startDrop(clone(target), target.code);
    if (!ack.accepted) {
      setStatus(id, "failed");
      throw new ApiError(ack.message, 409);
    }
    return clone(targetOrThrow(id));
  },

  async cancel(id) {
    await latency();
    const target = targetOrThrow(id);
    if (!ACTIVE.has(target.status)) return clone(target);
    if (!simEngine().cancelDrop(id)) setStatus(id, "cancelled");
    return clone(targetOrThrow(id));
  },
};
