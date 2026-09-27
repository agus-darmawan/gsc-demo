import { DEFAULT_FLIGHT_PARAMS, DEMO_BASE } from "@/constants/defaults";
import { offsetM } from "@/lib/geo";
import { generateOrbit, generateSurvey } from "@/lib/mission";
import type { UserRole } from "@/types/auth";
import type { Camera } from "@/types/camera";
import type { Drone } from "@/types/drone";
import type { DropTarget } from "@/types/drop";
import type { MissionPlan } from "@/types/mission";
import type { DetectionModel } from "@/types/model";

export interface MockUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
  unit: string | null;
}

export interface MockDatabase {
  version: number;
  users: MockUser[];
  drones: Drone[];
  models: DetectionModel[];
  missions: MissionPlan[];
  drops: DropTarget[];
  /** stream id -> detection model ids running together */
  streamModels: Record<string, string[]>;
  cameras: Camera[];
  dropSequence: number;
}

export const DB_VERSION = 4;

const iso = (offsetMs = 0) => new Date(Date.now() - offsetMs).toISOString();

function drone(
  partial: Omit<
    Drone,
    "createdAt" | "updatedAt" | "params" | "serialNumber" | "notes" | "demo"
  > &
    Partial<Pick<Drone, "params" | "serialNumber" | "notes" | "demo">>,
): Drone {
  return {
    demo: false,
    serialNumber: null,
    notes: null,
    params: DEFAULT_FLIGHT_PARAMS,
    createdAt: iso(40 * 86_400_000),
    updatedAt: iso(2 * 86_400_000),
    ...partial,
  };
}

export const PATROL_PLAN_ID = "msn-patrol-01";
export const SURVEY_PLAN_ID = "msn-survey-01";

export function createSeed(): MockDatabase {
  const drones: Drone[] = [
    drone({
      id: "evo2-v3-001",
      callsign: "GARUDA-1",
      model: "Autel EVO II Dual 640T V3",
      type: "multirotor",
      serialNumber: "7ABF-2231-EV3",
      telemetry: {
        enabled: true,
        protocol: "websocket",
        url: "ws://10.10.1.21:3000/ws/drone",
        systemId: null,
      },
      videoSources: [
        {
          id: "main",
          name: "Kamera utama",
          protocol: "rtmp",
          url: "rtmp://10.10.1.5/live/autelevo2",
          primary: true,
        },
        {
          id: "thermal",
          name: "Termal",
          protocol: "rtmp",
          url: "rtmp://10.10.1.5/live/autelevo2_ir",
          primary: false,
        },
      ],
    }),
    drone({
      id: "litox1-001",
      callsign: "ELANG-2",
      model: "LITO X1",
      type: "multirotor",
      telemetry: {
        enabled: true,
        protocol: "mavlink-udp",
        url: "udp://0.0.0.0:14550",
        systemId: 1,
      },
      videoSources: [
        {
          id: "main",
          name: "Kamera utama",
          protocol: "rtmp",
          url: "rtmp://10.10.1.5/live/litox1",
          primary: true,
        },
      ],
      params: { ...DEFAULT_FLIGHT_PARAMS, cruiseSpeedMs: 10 },
    }),
    drone({
      id: "evo2-v3-002",
      callsign: "GARUDA-3",
      demo: true,
      model: "Autel EVO II Pro V3",
      type: "multirotor",
      telemetry: {
        enabled: true,
        protocol: "websocket",
        url: "ws://10.10.1.22:3000/ws/drone",
        systemId: null,
      },
      videoSources: [
        {
          id: "main",
          name: "Kamera utama",
          protocol: "rtmp",
          url: "rtmp://10.10.1.5/live/autelevo2_b",
          primary: true,
        },
      ],
    }),
    drone({
      id: "m30t-001",
      callsign: "RAJAWALI-4",
      model: "DJI Matrice 30T",
      type: "multirotor",
      notes: "Telemetri belum didukung, hanya video.",
      telemetry: {
        enabled: false,
        protocol: "websocket",
        url: "",
        systemId: null,
      },
      videoSources: [
        {
          id: "rgb",
          name: "RGB",
          protocol: "rtmp",
          url: "rtmp://10.10.1.5/live/djimatrice_rgb",
          primary: true,
        },
        {
          id: "thermal",
          name: "Termal",
          protocol: "rtmp",
          url: "rtmp://10.10.1.5/live/djimatrice_thermal",
          primary: false,
        },
      ],
    }),
    drone({
      id: "vtol-001",
      callsign: "WALET-5",
      model: "VTOL Mapper 2.4",
      type: "vtol",
      telemetry: {
        enabled: true,
        protocol: "mavlink-tcp",
        url: "tcp://10.10.1.30:5760",
        systemId: 2,
      },
      videoSources: [
        {
          id: "main",
          name: "Kamera pemetaan",
          protocol: "rtsp",
          url: "rtsp://10.10.1.30:8554/main",
          primary: true,
        },
      ],
      params: { ...DEFAULT_FLIGHT_PARAMS, rtlAltM: 80, cruiseSpeedMs: 18 },
    }),
  ];

  const patrolCenter = offsetM(DEMO_BASE, 350, 450);
  const surveyA = offsetM(DEMO_BASE, -700, 200);
  const surveyB = offsetM(DEMO_BASE, -1100, 800);

  const missions: MissionPlan[] = [
    {
      id: PATROL_PLAN_ID,
      name: "Patroli perimeter pangkalan",
      droneId: "evo2-v3-001",
      takeoffAltM: 40,
      endAction: "rtl",
      repeat: true,
      waypoints: generateOrbit(patrolCenter, 650, 6, 100),
      updatedAt: iso(86_400_000),
    },
    {
      id: SURVEY_PLAN_ID,
      name: "Survei sektor selatan",
      droneId: "litox1-001",
      takeoffAltM: 30,
      endAction: "rtl",
      repeat: false,
      waypoints: generateSurvey(surveyA, surveyB, 90, 80),
      updatedAt: iso(3 * 3_600_000),
    },
  ];

  const models: DetectionModel[] = [
    {
      id: "mdl-visdrone",
      name: "YOLOv8 VisDrone",
      description: "Deteksi objek udara umum: orang, kendaraan, sepeda motor.",
      fileName: "yolov8s-visdrone.pt",
      fileSizeBytes: 22_540_000,
      format: "pytorch",
      classes: [
        "pedestrian",
        "people",
        "bicycle",
        "car",
        "van",
        "truck",
        "tricycle",
        "bus",
        "motor",
      ],
      inputSize: 640,
      key: "visdrone",
      confidence: 0.35,
      everyN: 1,
      classFilter: [],
      color: "#39d0d8",
      status: "loaded",
      error: null,
      uploadedAt: iso(12 * 86_400_000),
      uploadedBy: "admin",
    },
    {
      id: "mdl-person",
      name: "Deteksi personel",
      description: "Deteksi manusia dari ketinggian 50–150 m untuk SAR.",
      fileName: "person-aerial-v3.onnx",
      fileSizeBytes: 43_110_000,
      format: "onnx",
      classes: ["person"],
      inputSize: 960,
      key: "person",
      confidence: 0.35,
      everyN: 1,
      classFilter: [],
      color: "#f5a524",
      status: "loaded",
      error: null,
      uploadedAt: iso(6 * 86_400_000),
      uploadedBy: "admin",
    },
    {
      id: "mdl-fire",
      name: "Api dan asap",
      description: "Deteksi titik api dan kepulan asap untuk patroli hutan.",
      fileName: "fire-smoke-yolo11n.pt",
      fileSizeBytes: 6_210_000,
      format: "pytorch",
      classes: ["fire", "smoke"],
      inputSize: 640,
      key: "fire",
      confidence: 0.35,
      everyN: 1,
      classFilter: [],
      color: "#a78bfa",
      status: "uploaded",
      error: null,
      uploadedAt: iso(2 * 86_400_000),
      uploadedBy: "operator",
    },
    {
      id: "mdl-vehicle-trt",
      name: "Kendaraan taktis",
      description: null,
      fileName: "tactical-vehicle-fp16.engine",
      fileSizeBytes: 31_870_000,
      format: "tensorrt",
      classes: ["truck", "apc", "tank", "jeep"],
      inputSize: 640,
      key: "vehicle-trt",
      confidence: 0.35,
      everyN: 1,
      classFilter: [],
      color: "#f87171",
      status: "failed",
      error:
        "Engine TensorRT dibuat untuk GPU lain (sm_87), server memakai sm_89.",
      uploadedAt: iso(86_400_000),
      uploadedBy: "operator",
    },
  ];

  const now = iso();
  const drops: DropTarget[] = [
    {
      id: "drp-seed-1",
      code: "DRP-001",
      ...offsetM(DEMO_BASE, 900, -600),
      dropAltM: 30,
      approachSpeedMs: 8,
      afterAction: "rtl",
      droneId: "evo2-v3-002",
      status: "draft",
      note: "Logistik: kotak medis",
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    version: DB_VERSION,
    users: [
      {
        id: "usr-admin",
        username: "admin",
        password: "admin12345",
        displayName: "Administrator",
        role: "admin",
        unit: "Pusat Komando",
      },
      {
        id: "usr-operator",
        username: "operator",
        password: "pasupati",
        displayName: "Darmawan",
        role: "operator",
        unit: "Tim Udara 1",
      },
    ],
    drones,
    models,
    missions,
    drops,
    streamModels: { "evo2-v3-001.main": ["mdl-visdrone"] },
    cameras: [
      {
        id: "cctv-gerbang",
        name: "CCTV Gerbang Utama",
        protocol: "rtmp",
        url: "rtmp://192.168.1.10/live/cctv1",
        lat: -6.2079,
        lon: 106.8439,
        notes: "Ponsel sebagai CCTV",
        createdAt: iso(86_400_000),
        updatedAt: iso(86_400_000),
      },
    ],
    dropSequence: 1,
  };
}
