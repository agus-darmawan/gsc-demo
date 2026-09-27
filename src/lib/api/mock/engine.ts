import { clone, readDb, updateDb } from "./db";
import { getSimEngine, type SimEngine } from "./simulator/sim-engine";

/**
 * Returns the simulator, seeding it from the demo database on first use and
 * wiring drop progress back into storage.
 */
export function simEngine(): SimEngine {
  const engine = getSimEngine();
  if (engine.isSeeded()) return engine;

  const db = readDb();
  engine.syncFleet(db.drones, { missions: db.missions });
  engine.setDropSink(({ targetId, status }) => {
    let updated = null;
    updateDb((data) => {
      const target = data.drops.find((d) => d.id === targetId);
      if (!target) return;
      target.status = status;
      target.updatedAt = new Date().toISOString();
      updated = clone(target);
    });
    return updated;
  });
  engine.announce({
    severity: "info",
    category: "system",
    message: "GCS siap. Mode demo: semua wahana disimulasikan.",
  });
  const lost = db.drones.find((d) => d.id === "vtol-001");
  if (lost?.telemetry.enabled) {
    engine.announce(
      {
        severity: "critical",
        category: "link",
        message: `${lost.callsign}: Link telemetri terputus sejak 45 detik lalu`,
      },
      lost.id,
    );
  }
  return engine;
}
