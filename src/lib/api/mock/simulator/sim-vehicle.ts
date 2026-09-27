import {
  bearingDeg,
  destination,
  distanceM,
  headingDelta,
  normalizeHeading,
  toRad,
} from "@/lib/geo";
import { BATTERY_DRAIN } from "@/lib/mission";
import { clamp } from "@/lib/utils";
import type { CommandAck, VehicleCommand } from "@/types/command";
import type { FlightParameters } from "@/types/drone";
import type { DropAfterAction, DropStatus } from "@/types/drop";
import type { EventCategory, EventSeverity } from "@/types/event";
import type { LatLon, LatLonAlt } from "@/types/geo";
import type { MissionPlan } from "@/types/mission";
import type {
  DroneTelemetry,
  FlightMode,
  FlightPhase,
  PayloadState,
} from "@/types/telemetry";

// Airframe performance (generic quadcopter).
const TURN_RATE_DPS = 90;
const ACCEL_MS2 = 3;
const CLIMB_MS = 3;
const DESCENT_MS = 2;
const LAND_SLOW_MS = 0.7;
const VERTICAL_ACCEL_MS2 = 2;
const ARRIVE_RADIUS_M = 2.5;
const HOME_ALT_MSL_M = 8;
const AUTO_DISARM_MS = 2_500;
const DEMO_BATTERY_SWAP_MS = 20_000;
const STABILIZE_MS = 3_000;
const CRITICAL_BATTERY_PCT = 10;
const MIN_TAKEOFF_BATTERY_PCT = 25;

export interface SimEvent {
  severity: EventSeverity;
  category: EventCategory;
  message: string;
}

export interface DropProgress {
  targetId: string;
  status: DropStatus;
}

export interface TickResult {
  events: SimEvent[];
  drops: DropProgress[];
}

export interface DropOrder {
  targetId: string;
  code: string;
  target: LatLonAlt;
  speedMs: number;
  after: DropAfterAction;
}

type Task =
  | { kind: "idle" }
  | { kind: "takeoff"; altM: number; next: Task }
  | { kind: "hold"; altM: number }
  | { kind: "goto"; target: LatLonAlt; speedMs: number }
  | { kind: "mission"; seq: number; holdUntil: number | null; reached: boolean }
  | { kind: "rtl"; stage: "climb" | "cruise" }
  | { kind: "land" }
  | {
      kind: "drop";
      order: DropOrder;
      stage: "approach" | "stabilize";
      stageUntil: number | null;
    };

export interface VehicleInit {
  id: string;
  callsign: string;
  params: FlightParameters;
  home: LatLon;
  position?: LatLonAlt;
  heading?: number;
  batteryPct?: number;
  mission?: MissionPlan | null;
  /** Start airborne flying the given mission from waypoint index. */
  flyingMissionFrom?: number;
  linkLost?: boolean;
}

const ok = (message: string): CommandAck => ({ accepted: true, message });
const reject = (message: string): CommandAck => ({ accepted: false, message });

/** Single simulated vehicle: kinematics, flight state machine and failsafes. */
export class SimVehicle {
  readonly id: string;
  callsign: string;
  params: FlightParameters;
  linkLost: boolean;
  lastFrameAt = 0;

  private lat: number;
  private lon: number;
  private altM: number;
  private heading: number;
  private groundSpeed = 0;
  private climbRate = 0;
  private roll = 0;
  private pitch = 0;
  private armed = false;
  private mode: FlightMode = "LOITER";
  private phase: FlightPhase = "landed";
  private battery: number;
  private home: LatLon;
  private flightTimeS = 0;
  private payload: PayloadState = "armed";
  private satellites = 17;
  private hdop = 0.8;
  private rssi = 100;

  private task: Task = { kind: "idle" };
  private mission: MissionPlan | null;
  private pausedSeq: number | null = null;
  private landedSince: number | null = null;
  private lowBatteryWarned = false;
  private returningDropId: string | null = null;

  private events: SimEvent[] = [];
  private drops: DropProgress[] = [];

  constructor(init: VehicleInit) {
    this.id = init.id;
    this.callsign = init.callsign;
    this.params = init.params;
    this.home = init.home;
    this.lat = init.position?.lat ?? init.home.lat;
    this.lon = init.position?.lon ?? init.home.lon;
    this.altM = init.position?.altM ?? 0;
    this.heading = init.heading ?? Math.random() * 360;
    this.battery = init.batteryPct ?? 100;
    this.mission = init.mission ?? null;
    this.linkLost = init.linkLost ?? false;

    if (this.linkLost && this.altM > 0) {
      // Vehicle that dropped its link mid-flight.
      this.armed = true;
      this.phase = "airborne";
      this.mode = "AUTO";
    }

    if (init.flyingMissionFrom !== undefined && this.mission) {
      this.armed = true;
      this.phase = "airborne";
      this.mode = "AUTO";
      this.groundSpeed = this.params.cruiseSpeedMs;
      this.flightTimeS = 240 + Math.random() * 300;
      this.task = {
        kind: "mission",
        seq: init.flyingMissionFrom,
        holdUntil: null,
        reached: false,
      };
    }
  }

  get position(): LatLon {
    return { lat: this.lat, lon: this.lon };
  }

  get isAirborne(): boolean {
    return this.phase !== "landed";
  }

  get activeDropId(): string | null {
    return this.task.kind === "drop" ? this.task.order.targetId : null;
  }

  // ── Commands ─────────────────────────────────────────────────────────

  command(cmd: VehicleCommand, now: number): CommandAck {
    if (this.linkLost) return reject("Link telemetri terputus");

    switch (cmd.type) {
      case "arm":
        if (this.armed) return reject("Motor sudah aktif");
        if (this.isAirborne) return reject("Drone sedang terbang");
        this.arm(now);
        return ok("Motor diaktifkan");

      case "disarm":
        if (!this.armed) return reject("Motor sudah mati");
        if (this.isAirborne)
          return reject("Tidak bisa mematikan motor saat terbang");
        this.disarm("Motor dimatikan");
        return ok("Motor dimatikan");

      case "takeoff": {
        if (this.isAirborne) return reject("Drone sudah di udara");
        if (this.battery < MIN_TAKEOFF_BATTERY_PCT)
          return reject("Baterai terlalu rendah untuk lepas landas");
        const alt = this.limitAlt(cmd.altM);
        this.startTakeoff(alt, { kind: "hold", altM: alt }, now);
        this.mode = "GUIDED";
        return ok(`Lepas landas ke ${alt} m`);
      }

      case "land":
        if (!this.isAirborne) return reject("Drone sudah di darat");
        this.startLand();
        return ok("Mendarat di posisi saat ini");

      case "rtl":
        if (!this.isAirborne) return reject("Drone sudah di darat");
        this.startRtl("Kembali ke home");
        return ok("Kembali ke home");

      case "hold":
        if (!this.isAirborne) return reject("Drone masih di darat");
        this.startHold();
        return ok("Menahan posisi");

      case "set-mode":
        return this.setMode(cmd.mode, now);

      case "goto": {
        if (!this.isAirborne) return reject("Lepas landas terlebih dahulu");
        const alt = this.limitAlt(cmd.altM);
        this.cancelActiveDrop();
        this.mode = "GUIDED";
        this.task = {
          kind: "goto",
          target: { lat: cmd.lat, lon: cmd.lon, altM: alt },
          speedMs: this.params.cruiseSpeedMs,
        };
        const dist = distanceM(this.position, cmd);
        this.emit(
          "info",
          "vehicle",
          `Menuju titik tujuan (${Math.round(dist)} m)`,
        );
        return ok(`Menuju titik tujuan pada ${alt} m`);
      }

      case "mission-start":
        return this.startMission(now);

      case "mission-pause":
        if (this.task.kind !== "mission")
          return reject("Tidak ada misi berjalan");
        this.pausedSeq = this.task.seq;
        this.startHold();
        this.emit(
          "info",
          "mission",
          `Misi dijeda di titik ${this.pausedSeq + 1}`,
        );
        return ok("Misi dijeda");

      case "set-lens":
        return ok(`Lensa kamera: ${cmd.lens.toUpperCase()}`);
      case "payload-release":
        if (!this.isAirborne) return reject("Drone masih di darat");
        if (this.payload === "released") return reject("Payload sudah dilepas");
        this.releasePayload();
        return ok("Payload dilepas");
    }
  }

  setMission(plan: MissionPlan): CommandAck {
    if (plan.waypoints.length === 0) return reject("Misi tidak memiliki titik");
    this.mission = plan;
    this.pausedSeq = null;
    this.emit(
      "info",
      "mission",
      `Misi "${plan.name}" diunggah (${plan.waypoints.length} titik)`,
    );
    return ok(`Misi diunggah: ${plan.waypoints.length} titik`);
  }

  startDrop(order: DropOrder, now: number): CommandAck {
    if (this.linkLost) return reject("Link telemetri terputus");
    if (this.battery < MIN_TAKEOFF_BATTERY_PCT)
      return reject("Baterai terlalu rendah untuk misi drop");
    if (this.payload === "released")
      return reject("Payload sudah dilepas, isi ulang terlebih dahulu");

    this.cancelActiveDrop();
    const target: LatLonAlt = {
      ...order.target,
      altM: this.limitAlt(order.target.altM),
    };
    const dropTask: Task = {
      kind: "drop",
      order: { ...order, target },
      stage: "approach",
      stageUntil: null,
    };

    this.mode = "GUIDED";
    if (!this.isAirborne) {
      this.startTakeoff(target.altM, dropTask, now);
    } else {
      this.task = dropTask;
    }
    this.progress(order.targetId, "enroute");
    this.emit("info", "payload", `Menuju titik drop ${order.code}`);
    return ok(`Menuju titik drop ${order.code}`);
  }

  cancelDrop(targetId: string): boolean {
    if (this.activeDropId !== targetId) return false;
    this.progress(targetId, "cancelled");
    this.emit("warning", "payload", "Misi drop dibatalkan, menahan posisi");
    this.startHold();
    return true;
  }

  updateConfig(callsign: string, params: FlightParameters): void {
    this.callsign = callsign;
    this.params = params;
  }

  // ── Simulation ───────────────────────────────────────────────────────

  tick(dt: number, now: number): TickResult {
    this.runTask(dt, now);
    this.updateBattery(dt);
    this.updateSensors();
    if (this.isAirborne) this.flightTimeS += dt;
    return this.drain();
  }

  /** Events and drop progress produced since the last drain (commands included). */
  drain(): TickResult {
    const result = { events: this.events, drops: this.drops };
    this.events = [];
    this.drops = [];
    return result;
  }

  telemetry(now: number): DroneTelemetry {
    const missionTotal = this.mission?.waypoints.length ?? null;
    const missionSeq = this.task.kind === "mission" ? this.task.seq + 1 : null;
    return {
      timestamp: now,
      lat: this.lat,
      lon: this.lon,
      altM: round(this.altM, 1),
      altMslM: round(this.altM + HOME_ALT_MSL_M, 1),
      rollDeg: round(this.roll, 1),
      pitchDeg: round(this.pitch, 1),
      headingDeg: round(this.heading, 1),
      groundSpeedMs: round(this.groundSpeed, 2),
      climbRateMs: round(this.climbRate, 2),
      satellites: this.satellites,
      gpsFix: this.satellites >= 6 ? "3d" : "2d",
      hdop: round(this.hdop, 2),
      batteryPct: round(this.battery, 1),
      batteryV: round(13.6 + 3.2 * (this.battery / 100), 2),
      batteryA: round(this.current(), 1),
      rssiPct: Math.round(this.rssi),
      armed: this.armed,
      flightMode: this.mode,
      phase: this.phase,
      homeLat: this.home.lat,
      homeLon: this.home.lon,
      distanceToHomeM: Math.round(distanceM(this.position, this.home)),
      flightTimeS: Math.round(this.flightTimeS),
      missionSeq,
      missionTotal: this.task.kind === "mission" ? missionTotal : null,
      payload: this.payload,
      gimbalPitchDeg: this.task.kind === "drop" ? -90 : -30,
    };
  }

  // ── Task runner ──────────────────────────────────────────────────────

  private runTask(dt: number, now: number): void {
    const task = this.task;
    switch (task.kind) {
      case "idle":
        this.decelerate(dt);
        this.climbRate = 0;
        this.handleGround(now);
        return;

      case "takeoff":
        this.phase = "takeoff";
        this.decelerate(dt);
        this.climbToward(task.altM, dt);
        this.level(dt);
        if (this.altM >= task.altM - 0.5) {
          this.phase = "airborne";
          this.emit(
            "info",
            "vehicle",
            `Mencapai ketinggian ${Math.round(task.altM)} m`,
          );
          this.task = task.next;
          if (task.next.kind === "mission") this.mode = "AUTO";
        }
        return;

      case "hold":
        this.decelerate(dt);
        this.climbToward(task.altM, dt);
        this.level(dt);
        return;

      case "goto":
        if (this.navigate(task.target, task.speedMs, dt)) {
          this.emit("info", "vehicle", "Tiba di titik tujuan, menahan posisi");
          this.mode = "LOITER";
          this.task = { kind: "hold", altM: task.target.altM };
        }
        return;

      case "mission":
        this.runMission(task, dt, now);
        return;

      case "rtl":
        this.runRtl(task, dt);
        return;

      case "land":
        this.runLand(dt, now);
        return;

      case "drop":
        this.runDrop(task, dt, now);
        return;
    }
  }

  private runMission(
    task: Extract<Task, { kind: "mission" }>,
    dt: number,
    now: number,
  ): void {
    const plan = this.mission;
    const wp = plan?.waypoints[task.seq];
    if (!plan || !wp) {
      this.finishMission();
      return;
    }

    const arrived = this.navigate(
      wp,
      wp.speedMs ?? this.params.cruiseSpeedMs,
      dt,
    );
    if (!arrived) return;

    const total = plan.waypoints.length;
    if (!task.reached) {
      task.reached = true;
      this.emit("info", "mission", `Titik ${task.seq + 1}/${total} tercapai`);
      if (wp.action === "photo")
        this.emit("info", "mission", `Foto diambil di titik ${task.seq + 1}`);
      if (wp.action === "release" && this.payload !== "released")
        this.releasePayload();
      const holdS = wp.action === "hover" ? Math.max(5, wp.holdS) : wp.holdS;
      task.holdUntil = holdS > 0 ? now + holdS * 1000 : null;
    }

    if (task.holdUntil !== null && now < task.holdUntil) return;

    const nextSeq = task.seq + 1;
    if (nextSeq < total) {
      this.task = {
        kind: "mission",
        seq: nextSeq,
        holdUntil: null,
        reached: false,
      };
    } else if (plan.repeat) {
      this.emit("info", "mission", "Misi diulang dari titik pertama");
      this.task = { kind: "mission", seq: 0, holdUntil: null, reached: false };
    } else {
      this.finishMission();
    }
  }

  private finishMission(): void {
    const plan = this.mission;
    this.emit("info", "mission", "Misi selesai");
    this.pausedSeq = null;
    switch (plan?.endAction ?? "hold") {
      case "rtl":
        this.startRtl("Kembali ke home", "info");
        return;
      case "land":
        this.startLand();
        return;
      default:
        this.startHold();
    }
  }

  private runRtl(task: Extract<Task, { kind: "rtl" }>, dt: number): void {
    const cruiseAlt = Math.max(this.altM, this.params.rtlAltM);
    if (task.stage === "climb") {
      this.decelerate(dt);
      this.climbToward(this.params.rtlAltM, dt);
      this.level(dt);
      if (this.altM >= this.params.rtlAltM - 1) task.stage = "cruise";
      return;
    }
    const arrived = this.navigate(
      { ...this.home, altM: cruiseAlt },
      this.params.cruiseSpeedMs,
      dt,
    );
    if (arrived) {
      this.emit("info", "vehicle", "Tiba di atas home");
      this.startLand();
    }
  }

  private runLand(dt: number, now: number): void {
    this.phase = "landing";
    this.decelerate(dt);
    this.level(dt);
    const rate = this.altM > 10 ? DESCENT_MS : LAND_SLOW_MS;
    this.climbRate = -rate;
    this.altM = Math.max(0, this.altM - rate * dt);
    if (this.altM <= 0.05) {
      this.altM = 0;
      this.climbRate = 0;
      this.phase = "landed";
      this.task = { kind: "idle" };
      this.landedSince = now;
      this.emit("info", "vehicle", "Telah mendarat");
      if (this.returningDropId) {
        this.progress(this.returningDropId, "completed");
        this.returningDropId = null;
      }
    }
  }

  private runDrop(
    task: Extract<Task, { kind: "drop" }>,
    dt: number,
    now: number,
  ): void {
    const { order } = task;
    if (task.stage === "approach") {
      if (this.navigate(order.target, order.speedMs, dt)) {
        task.stage = "stabilize";
        task.stageUntil = now + STABILIZE_MS;
        this.progress(order.targetId, "stabilizing");
        this.emit(
          "info",
          "payload",
          `Tiba di ${order.code}, menstabilkan posisi`,
        );
      }
      return;
    }

    this.decelerate(dt);
    this.climbToward(order.target.altM, dt);
    this.level(dt);
    if (task.stageUntil !== null && now < task.stageUntil) return;

    this.releasePayload(order.code);
    this.progress(order.targetId, "released");

    if (order.after === "rtl") {
      this.returningDropId = order.targetId;
      this.progress(order.targetId, "returning");
      this.startRtl("Drop selesai, kembali ke home", "info");
    } else {
      this.progress(order.targetId, "completed");
      this.startHold();
    }
  }

  // ── State transitions ────────────────────────────────────────────────

  private setMode(mode: FlightMode, now: number): CommandAck {
    switch (mode) {
      case "RTL":
        return this.command({ type: "rtl" }, now);
      case "LAND":
        return this.command({ type: "land" }, now);
      case "AUTO":
        return this.startMission(now);
      case "MANUAL":
      case "STABILIZE":
        return reject("Mode manual hanya dapat dipilih dari remote control");
      default:
        this.mode = mode;
        if (this.isAirborne) {
          this.cancelActiveDrop();
          this.task = { kind: "hold", altM: this.altM };
        }
        this.emit("info", "vehicle", `Mode diubah ke ${mode}`);
        return ok(`Mode ${mode}`);
    }
  }

  private startMission(now: number): CommandAck {
    const plan = this.mission;
    if (!plan || plan.waypoints.length === 0)
      return reject("Belum ada misi yang diunggah ke drone");
    if (this.battery < MIN_TAKEOFF_BATTERY_PCT)
      return reject("Baterai terlalu rendah untuk memulai misi");

    this.cancelActiveDrop();
    const seq = this.pausedSeq ?? 0;
    this.pausedSeq = null;
    const missionTask: Task = {
      kind: "mission",
      seq,
      holdUntil: null,
      reached: false,
    };

    if (!this.isAirborne) {
      this.startTakeoff(plan.takeoffAltM, missionTask, now);
    } else {
      this.mode = "AUTO";
      this.task = missionTask;
    }
    this.emit(
      "info",
      "mission",
      seq > 0
        ? `Misi dilanjutkan dari titik ${seq + 1}`
        : `Misi dimulai (${plan.waypoints.length} titik)`,
    );
    return ok(seq > 0 ? "Misi dilanjutkan" : "Misi dimulai");
  }

  private startTakeoff(altM: number, next: Task, now: number): void {
    if (!this.armed) this.arm(now);
    this.phase = "takeoff";
    this.task = { kind: "takeoff", altM, next };
    this.emit("info", "vehicle", `Lepas landas ke ${Math.round(altM)} m`);
  }

  private startHold(): void {
    this.mode = "LOITER";
    this.task = { kind: "hold", altM: this.altM };
  }

  private startLand(): void {
    this.cancelActiveDrop();
    this.mode = "LAND";
    this.task = { kind: "land" };
    this.emit("info", "vehicle", "Mulai mendarat");
  }

  private startRtl(reason: string, severity: EventSeverity = "warning"): void {
    if (this.task.kind === "mission") this.pausedSeq = null;
    this.mode = "RTL";
    this.task = {
      kind: "rtl",
      stage: this.altM < this.params.rtlAltM - 1 ? "climb" : "cruise",
    };
    this.emit(severity, "vehicle", reason);
  }

  private arm(now: number): void {
    this.armed = true;
    this.landedSince = now;
    this.emit("info", "vehicle", "Motor diaktifkan");
  }

  private disarm(message: string): void {
    this.armed = false;
    this.landedSince = null;
    this.flightTimeS = 0;
    this.emit("info", "vehicle", message);
  }

  private cancelActiveDrop(): void {
    const id = this.activeDropId;
    if (id) this.progress(id, "cancelled");
  }

  private releasePayload(code?: string): void {
    this.payload = "released";
    this.emit(
      "warning",
      "payload",
      code ? `Payload dilepas di ${code}` : "Payload dilepas",
    );
  }

  private handleGround(now: number): void {
    if (
      this.armed &&
      this.landedSince &&
      now - this.landedSince > AUTO_DISARM_MS * 4
    ) {
      this.disarm("Motor dimatikan otomatis (tidak ada perintah)");
      this.landedSince = now;
      return;
    }
    if (
      this.armed &&
      this.mode === "LAND" &&
      this.landedSince &&
      now - this.landedSince > AUTO_DISARM_MS
    ) {
      this.mode = "LOITER";
      this.disarm("Motor dimatikan setelah mendarat");
      this.landedSince = now;
      return;
    }
    // Demo only: ground crew swaps the battery and reloads the payload.
    if (
      !this.armed &&
      this.landedSince &&
      now - this.landedSince > DEMO_BATTERY_SWAP_MS
    ) {
      if (this.battery < 60 || this.payload === "released") {
        this.battery = 100;
        this.payload = "armed";
        this.lowBatteryWarned = false;
        this.emit("info", "vehicle", "Baterai diganti dan payload diisi ulang");
      }
      this.landedSince = null;
    }
  }

  // ── Physics ──────────────────────────────────────────────────────────

  /** Flies toward `target`. Returns true when the target is reached. */
  private navigate(target: LatLonAlt, speedMs: number, dt: number): boolean {
    const pos = this.position;
    const dist = distanceM(pos, target);
    const bearing = dist > 0.5 ? bearingDeg(pos, target) : this.heading;

    const err = headingDelta(this.heading, bearing);
    const maxTurn = TURN_RATE_DPS * dt;
    const turn = clamp(err, -maxTurn, maxTurn);
    this.heading = normalizeHeading(this.heading + turn);

    const align = Math.max(0, Math.cos(toRad(Math.min(90, Math.abs(err)))));
    const brake = Math.sqrt(2 * ACCEL_MS2 * Math.max(0, dist - 1));
    const desired = Math.min(speedMs, brake) * align;
    const dv = clamp(
      desired - this.groundSpeed,
      -ACCEL_MS2 * dt,
      ACCEL_MS2 * dt,
    );
    this.groundSpeed = Math.max(0, this.groundSpeed + dv);

    const step = Math.min(this.groundSpeed * dt, dist);
    if (step > 0) {
      const next = destination(pos, this.heading, step);
      this.lat = next.lat;
      this.lon = next.lon;
    }

    this.climbToward(target.altM, dt);
    this.roll = clamp((turn / dt) * this.groundSpeed * 0.1, -30, 30);
    this.pitch = clamp(-(this.groundSpeed / 12) * 8 - (dv / dt) * 2, -25, 15);

    const remaining = distanceM(this.position, target);
    const altOk = Math.abs(target.altM - this.altM) < 1;
    if (
      altOk &&
      (remaining < ARRIVE_RADIUS_M || (remaining < 6 && this.groundSpeed < 0.6))
    ) {
      this.lat = target.lat;
      this.lon = target.lon;
      return true;
    }
    return false;
  }

  private climbToward(targetAltM: number, dt: number): void {
    const err = targetAltM - this.altM;
    const desired = clamp(err * 0.8, -DESCENT_MS, CLIMB_MS);
    const dv = clamp(
      desired - this.climbRate,
      -VERTICAL_ACCEL_MS2 * dt,
      VERTICAL_ACCEL_MS2 * dt,
    );
    this.climbRate += dv;
    this.altM = Math.max(0, this.altM + this.climbRate * dt);
  }

  private decelerate(dt: number): void {
    const dv = Math.min(this.groundSpeed, ACCEL_MS2 * dt);
    this.groundSpeed -= dv;
    if (this.groundSpeed > 0) {
      const next = destination(
        this.position,
        this.heading,
        this.groundSpeed * dt,
      );
      this.lat = next.lat;
      this.lon = next.lon;
    }
    this.pitch = this.groundSpeed > 0 ? clamp(dv / dt, 0, 10) : 0;
  }

  private level(dt: number): void {
    this.roll += (0 - this.roll) * Math.min(1, dt * 3);
  }

  private current(): number {
    if (!this.armed) return 0.3;
    if (!this.isAirborne) return 2.1;
    return 16 + this.groundSpeed * 0.9 + Math.max(0, this.climbRate) * 3;
  }

  private updateBattery(dt: number): void {
    if (!this.armed) return;
    const drain = this.isAirborne
      ? BATTERY_DRAIN.hoverPerS +
        BATTERY_DRAIN.perSpeedMs * this.groundSpeed +
        BATTERY_DRAIN.climbPerMs * Math.max(0, this.climbRate)
      : 0.01;
    this.battery = Math.max(0, this.battery - drain * dt);

    if (!this.lowBatteryWarned && this.battery < this.params.lowBatteryPct) {
      this.lowBatteryWarned = true;
      this.emit(
        "warning",
        "vehicle",
        `Baterai rendah (${Math.round(this.battery)}%)`,
      );
    }

    const returning = this.task.kind === "rtl" || this.task.kind === "land";
    if (this.isAirborne && this.battery < CRITICAL_BATTERY_PCT && !returning) {
      this.cancelActiveDrop();
      this.emit(
        "critical",
        "vehicle",
        "Baterai kritis, kembali otomatis ke home",
      );
      this.startRtl("Failsafe baterai: kembali ke home");
    }
    if (this.battery <= 0 && this.isAirborne && this.task.kind !== "land") {
      this.emit("critical", "vehicle", "Baterai habis, mendarat darurat");
      this.startLand();
    }
  }

  private updateSensors(): void {
    this.satellites = clamp(
      this.satellites +
        (Math.random() < 0.05 ? (Math.random() < 0.5 ? -1 : 1) : 0),
      12,
      22,
    );
    this.hdop = clamp(this.hdop + (Math.random() - 0.5) * 0.02, 0.6, 1.3);
    const distKm = distanceM(this.position, this.home) / 1000;
    const target = clamp(100 - distKm * 14, 18, 100);
    this.rssi += (target - this.rssi) * 0.1 + (Math.random() - 0.5) * 1.5;
    this.rssi = clamp(this.rssi, 0, 100);
  }

  // ── Output helpers ───────────────────────────────────────────────────

  private emit(
    severity: EventSeverity,
    category: EventCategory,
    message: string,
  ): void {
    this.events.push({ severity, category, message });
  }

  private progress(targetId: string, status: DropStatus): void {
    this.drops.push({ targetId, status });
  }

  private limitAlt(altM: number): number {
    const limited = clamp(Math.round(altM), 5, this.params.maxAltM);
    if (limited !== Math.round(altM)) {
      this.emit(
        "warning",
        "vehicle",
        `Ketinggian dibatasi ke ${limited} m (batas geofence ${this.params.maxAltM} m)`,
      );
    }
    return limited;
  }
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
