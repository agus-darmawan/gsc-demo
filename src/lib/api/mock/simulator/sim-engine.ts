import { DEMO_BASE } from "@/constants/defaults";
import { offsetM } from "@/lib/geo";
import { uid } from "@/lib/utils";
import type { CommandAck, VehicleCommand } from "@/types/command";
import type { Drone } from "@/types/drone";
import type { DropTarget } from "@/types/drop";
import type { GcsEvent } from "@/types/event";
import type { LatLon } from "@/types/geo";
import type { MissionPlan } from "@/types/mission";
import type { RealtimeMessage } from "../../contracts";
import { PATROL_PLAN_ID, SURVEY_PLAN_ID } from "../seed";
import { type DropProgress, type SimEvent, SimVehicle } from "./sim-vehicle";

const TICK_MS = 100;
/** Telemetry is published every Nth tick (5 Hz). */
const PUBLISH_EVERY = 2;
const EVENT_BUFFER = 300;

type Listener = (message: RealtimeMessage) => void;
type DropSink = (progress: DropProgress) => DropTarget | null;

interface ScenarioOptions {
  missions: MissionPlan[];
}

/**
 * Browser-side stand-in for the backend telemetry bridge. Owns every simulated
 * vehicle, advances physics on a fixed tick and publishes realtime messages.
 */
export class SimEngine {
  private vehicles = new Map<string, SimVehicle>();
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTick = 0;
  private tickCount = 0;
  private recent: GcsEvent[] = [];
  private dropSink: DropSink = () => null;
  private seeded = false;

  /** Where drop status changes are persisted (mock drops service). */
  setDropSink(sink: DropSink): void {
    this.dropSink = sink;
  }

  /** Aligns simulated vehicles with the drone registry. */
  syncFleet(drones: Drone[], scenario?: ScenarioOptions): void {
    const wanted = new Set<string>();
    drones.forEach((drone, index) => {
      if (!drone.telemetry.enabled) return;
      wanted.add(drone.id);
      const existing = this.vehicles.get(drone.id);
      if (existing) {
        existing.updateConfig(drone.callsign, drone.params);
        return;
      }
      this.vehicles.set(drone.id, this.createVehicle(drone, index, scenario));
    });
    for (const id of this.vehicles.keys()) {
      if (!wanted.has(id)) this.vehicles.delete(id);
    }
    this.seeded = true;
  }

  linkState(droneId: string): "connected" | "lost" | null {
    const vehicle = this.vehicles.get(droneId);
    if (!vehicle) return null;
    return vehicle.linkLost ? "lost" : "connected";
  }

  isSeeded(): boolean {
    return this.seeded;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    const now = Date.now();
    for (const vehicle of this.vehicles.values()) {
      listener({
        type: "link",
        droneId: vehicle.id,
        link: vehicle.linkLost ? "lost" : "connected",
        capabilities: ["telemetry", "commands", "mission", "drop", "lens"],
        bridge: "sim",
      });
      const frame = vehicle.telemetry(vehicle.linkLost ? now - 45_000 : now);
      listener({ type: "telemetry", droneId: vehicle.id, data: frame });
    }
    this.start();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }

  command(droneId: string, command: VehicleCommand): CommandAck {
    const vehicle = this.vehicles.get(droneId);
    if (!vehicle)
      return {
        accepted: false,
        message: "Drone tidak memiliki telemetri aktif",
      };
    const ack = vehicle.command(command, Date.now());
    this.flushPending(vehicle);
    return ack;
  }

  uploadMission(droneId: string, plan: MissionPlan): CommandAck {
    const vehicle = this.vehicles.get(droneId);
    if (!vehicle) {
      return {
        accepted: false,
        message: "Drone tidak memiliki telemetri aktif",
      };
    }
    if (vehicle.linkLost) {
      return { accepted: false, message: "Link telemetri terputus" };
    }
    const ack = vehicle.setMission(plan);
    this.flushPending(vehicle);
    return ack;
  }

  startDrop(target: DropTarget, code: string): CommandAck {
    const vehicle = target.droneId
      ? this.vehicles.get(target.droneId)
      : undefined;
    if (!vehicle) {
      return {
        accepted: false,
        message: "Drone belum dipilih atau tidak memiliki telemetri",
      };
    }
    for (const other of this.vehicles.values()) {
      if (other !== vehicle && other.activeDropId === target.id) {
        return {
          accepted: false,
          message: "Target sedang dijalankan drone lain",
        };
      }
    }
    const ack = vehicle.startDrop(
      {
        targetId: target.id,
        code,
        target: { lat: target.lat, lon: target.lon, altM: target.dropAltM },
        speedMs: target.approachSpeedMs,
        after: target.afterAction,
      },
      Date.now(),
    );
    this.flushPending(vehicle);
    return ack;
  }

  cancelDrop(targetId: string): boolean {
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.cancelDrop(targetId)) {
        this.flushPending(vehicle);
        return true;
      }
    }
    return false;
  }

  recentEvents(limit: number): GcsEvent[] {
    return this.recent.slice(0, limit);
  }

  /** Emits a system-level event (not tied to a vehicle). */
  announce(event: SimEvent, droneId: string | null = null): void {
    this.publishEvent(event, droneId);
  }

  // ── Loop ─────────────────────────────────────────────────────────────

  private start(): void {
    if (this.timer || typeof window === "undefined") return;
    this.lastTick = Date.now();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    const now = Date.now();
    // Clamp dt so a throttled background tab does not teleport vehicles.
    const dt = Math.min(0.5, (now - this.lastTick) / 1000);
    this.lastTick = now;
    this.tickCount += 1;
    const publish = this.tickCount % PUBLISH_EVERY === 0;

    for (const vehicle of this.vehicles.values()) {
      if (vehicle.linkLost) continue;
      const result = vehicle.tick(dt, now);
      this.flushVehicle(vehicle, result.events, result.drops, publish);
    }
  }

  /** Publishes what a command produced right away instead of on the next tick. */
  private flushPending(vehicle: SimVehicle): void {
    const { events, drops } = vehicle.drain();
    this.flushVehicle(vehicle, events, drops);
  }

  private flushVehicle(
    vehicle: SimVehicle,
    events: SimEvent[],
    drops: DropProgress[],
    publishTelemetry = true,
  ): void {
    for (const event of events)
      this.publishEvent(event, vehicle.id, vehicle.callsign);
    for (const progress of drops) {
      const target = this.dropSink(progress);
      if (target) this.emit({ type: "drop", target });
    }
    if (publishTelemetry) {
      this.emit({
        type: "telemetry",
        droneId: vehicle.id,
        data: vehicle.telemetry(Date.now()),
      });
    }
  }

  private publishEvent(
    event: SimEvent,
    droneId: string | null,
    callsign?: string,
  ): void {
    const gcsEvent: GcsEvent = {
      id: uid("evt"),
      timestamp: Date.now(),
      severity: event.severity,
      category: event.category,
      droneId,
      message: callsign ? `${callsign}: ${event.message}` : event.message,
    };
    this.recent.unshift(gcsEvent);
    if (this.recent.length > EVENT_BUFFER) this.recent.length = EVENT_BUFFER;
    this.emit({ type: "event", event: gcsEvent });
  }

  private emit(message: RealtimeMessage): void {
    for (const listener of this.listeners) listener(message);
  }

  // ── Scenario ─────────────────────────────────────────────────────────

  private createVehicle(
    drone: Drone,
    index: number,
    scenario?: ScenarioOptions,
  ): SimVehicle {
    const home = homeFor(index);
    const base = {
      id: drone.id,
      callsign: drone.callsign,
      params: drone.params,
      home,
    };
    if (!scenario) return new SimVehicle(base);

    const plan = (id: string) =>
      scenario.missions.find((m) => m.id === id) ?? null;

    switch (drone.id) {
      case "evo2-v3-001": {
        const mission = plan(PATROL_PLAN_ID);
        const start = mission?.waypoints[2];
        return new SimVehicle({
          ...base,
          mission,
          position: start
            ? { lat: start.lat, lon: start.lon, altM: start.altM }
            : undefined,
          batteryPct: 78,
          flyingMissionFrom: 3,
        });
      }
      case "litox1-001": {
        const mission = plan(SURVEY_PLAN_ID);
        const start = mission?.waypoints[1];
        return new SimVehicle({
          ...base,
          mission,
          position: start
            ? { lat: start.lat, lon: start.lon, altM: start.altM }
            : undefined,
          batteryPct: 66,
          flyingMissionFrom: 2,
        });
      }
      case "vtol-001": {
        const lost = offsetM(DEMO_BASE, -1500, -1300);
        return new SimVehicle({
          ...base,
          position: { ...lost, altM: 150 },
          heading: 310,
          batteryPct: 41,
          linkLost: true,
        });
      }
      default:
        return new SimVehicle({ ...base, batteryPct: 100 });
    }
  }
}

/** Homes are spread along the apron so markers do not overlap. */
function homeFor(index: number): LatLon {
  return offsetM(DEMO_BASE, -20, index * 18 - 36);
}

let engine: SimEngine | null = null;

export function getSimEngine(): SimEngine {
  engine ??= new SimEngine();
  return engine;
}
