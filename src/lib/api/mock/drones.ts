import { DEMO_BASE } from "@/constants/defaults";
import { offsetM } from "@/lib/geo";
import type { Drone } from "@/types/drone";
import type { FlightSession, PathPoint } from "@/types/telemetry";
import { ApiError } from "../client/errors";
import type { DronesApi } from "../contracts";
import { clone, latency, readDb, updateDb } from "./db";
import { simEngine } from "./engine";

function findIndex(id: string): number {
  const index = readDb().drones.findIndex((d) => d.id === id);
  if (index < 0) throw new ApiError("Drone tidak ditemukan", 404);
  return index;
}

/** Deterministic fake flight logs for the demo. */
function fakeSessions(droneId: string): FlightSession[] {
  const seed = [...droneId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const now = Date.now();
  return [2, 26, 50].map((hoursAgo, i) => {
    const startedAt = now - hoursAgo * 3_600_000 - (seed % 7) * 60_000;
    const center = offsetM(
      DEMO_BASE,
      ((seed * (i + 3)) % 900) - 450,
      ((seed * (i + 5)) % 1200) - 600,
    );
    const radius = 400 + ((seed + i * 97) % 500);
    const count = 240;
    const points: PathPoint[] = Array.from({ length: count + 1 }, (_, k) => {
      const a = (k / count) * Math.PI * 2;
      const p = offsetM(
        center,
        radius * Math.cos(a),
        radius * 1.4 * Math.sin(a),
      );
      return {
        t: startedAt + k * 1500,
        lat: p.lat,
        lon: p.lon,
        altM: 80 + 20 * Math.sin(a * 3),
      };
    });
    return {
      id: `${droneId}-log-${i}`,
      droneId,
      startedAt,
      endedAt: points[points.length - 1]?.t ?? startedAt,
      distanceM: 2 * Math.PI * radius * 1.2,
      points,
    };
  });
}

export const mockDronesApi: DronesApi = {
  async list() {
    await latency();
    return clone(readDb().drones);
  },

  async get(id) {
    await latency();
    return clone(readDb().drones[findIndex(id)] as Drone);
  },

  async create(input) {
    await latency(200);
    if (readDb().drones.some((d) => d.id === input.id)) {
      throw new ApiError(`ID drone "${input.id}" sudah terdaftar`, 409);
    }
    const now = new Date().toISOString();
    const drone: Drone = { ...clone(input), createdAt: now, updatedAt: now };
    const db = updateDb((data) => {
      data.drones.push(drone);
    });
    simEngine().syncFleet(db.drones);
    return clone(drone);
  },

  async update(id, input) {
    await latency(200);
    const index = findIndex(id);
    let updated: Drone | null = null;
    const db = updateDb((data) => {
      const current = data.drones[index];
      if (!current) return;
      updated = {
        ...clone(input),
        id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      data.drones[index] = updated;
    });
    simEngine().syncFleet(db.drones);
    if (!updated) throw new ApiError("Drone tidak ditemukan", 404);
    return clone(updated);
  },

  async remove(id) {
    await latency(150);
    findIndex(id);
    const db = updateDb((data) => {
      data.drones = data.drones.filter((d) => d.id !== id);
      for (const drop of data.drops)
        if (drop.droneId === id) drop.droneId = null;
    });
    simEngine().syncFleet(db.drones);
  },

  async testLink(link) {
    await latency(700 + Math.random() * 600);
    if (!link.enabled) {
      return { ok: false, latencyMs: null, message: "Telemetri dinonaktifkan" };
    }
    if (!link.url.trim() || link.url.includes("fail")) {
      return {
        ok: false,
        latencyMs: null,
        message: "Tidak ada heartbeat dalam 5 detik",
      };
    }
    const latencyMs = Math.round(8 + Math.random() * 35);
    const message = link.protocol.startsWith("mavlink")
      ? `Heartbeat MAVLink v2 diterima (sysid ${link.systemId ?? 1})`
      : "Bridge telemetri merespons";
    return { ok: true, latencyMs, message };
  },

  async flights(id) {
    await latency();
    const drone = readDb().drones.find((d) => d.id === id);
    if (!drone?.telemetry.enabled) return [];
    return fakeSessions(id);
  },
};
