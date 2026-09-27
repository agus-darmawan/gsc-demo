import type { Caption, Detection, Stream } from "@/types/stream";
import { ApiError } from "../client/errors";
import type { StreamsApi } from "../contracts";
import { clone, latency, readDb, updateDb } from "./db";
import { simEngine } from "./engine";

const MOCK_FILES = 4;

const CAPTIONS = [
  "Dua orang berjalan di sisi jalan dekat kendaraan yang terparkir.",
  "Sebuah truk bergerak ke arah utara di jalan utama.",
  "Area terbuka dengan beberapa kendaraan, tidak ada aktivitas mencurigakan.",
  "Sekelompok orang berkumpul di dekat bangunan beratap biru.",
  "Sepeda motor melintas di persimpangan, lalu lintas lengang.",
  "Asap tipis terlihat di sisi timur area pengamatan.",
  "Kendaraan roda empat berhenti di tepi lapangan, satu orang keluar.",
];

const GROUPS: Record<string, readonly string[]> = {
  orang: ["person", "pedestrian", "people"],
  kendaraan: ["car", "van", "truck", "bus", "motor", "motorcycle", "bicycle"],
};

function stream(
  id: string,
  owner: { droneId: string | null; cameraId: string | null },
  sourceId: string | null,
  name: string,
  protocol: Stream["protocol"],
  fileIndex: number,
  modelIds: string[],
  online: boolean,
): Stream {
  return {
    id,
    ...owner,
    sourceId,
    name,
    protocol,
    url: `/mock/stream-${fileIndex}.mp4${modelIds.length ? `?model=${modelIds.join(",")}` : ""}`,
    hlsUrl: "",
    path: id,
    modelId: modelIds[0] ?? null,
    modelIds,
    online,
    annotated: false,
  };
}

function buildStreams(): Stream[] {
  const db = readDb();
  const engine = simEngine();
  const streams: Stream[] = [];
  let fileIndex = 0;
  const next = () => {
    fileIndex = (fileIndex % MOCK_FILES) + 1;
    return fileIndex;
  };

  for (const drone of db.drones) {
    const offline = engine.linkState(drone.id) === "lost";
    for (const source of drone.videoSources) {
      const id = `${drone.id}.${source.id}`;
      streams.push(
        stream(
          id,
          { droneId: drone.id, cameraId: null },
          source.id,
          source.name,
          source.protocol,
          next(),
          db.streamModels[id] ?? [],
          !offline,
        ),
      );
    }
  }
  for (const camera of db.cameras) {
    const id = `cam.${camera.id}`;
    streams.push(
      stream(
        id,
        { droneId: null, cameraId: camera.id },
        null,
        camera.name,
        camera.protocol,
        next(),
        db.streamModels[id] ?? [],
        true,
      ),
    );
  }
  return streams;
}

function randomDetections(model: string, classes: string[]): Detection[] {
  const count = Math.floor(Math.random() * 5);
  return Array.from({ length: count }, (_, i) => {
    const x = 0.05 + Math.random() * 0.75;
    const y = 0.1 + Math.random() * 0.7;
    const w = 0.04 + Math.random() * 0.12;
    const h = 0.05 + Math.random() * 0.15;
    return {
      model,
      label: classes[Math.floor(Math.random() * classes.length)] ?? "object",
      confidence: 0.55 + Math.random() * 0.4,
      bbox: [x, y, Math.min(1, x + w), Math.min(1, y + h)],
      trackId: i + 1,
    };
  });
}

export const mockStreamsApi: StreamsApi = {
  async list() {
    await latency();
    return buildStreams();
  },

  async setModel(streamId, modelId) {
    return mockStreamsApi.setModels(streamId, modelId ? [modelId] : []);
  },

  async setModels(streamId, modelIds) {
    await latency(300);
    const db = readDb();
    for (const id of modelIds) {
      const model = db.models.find((m) => m.id === id);
      if (!model) throw new ApiError("Model tidak ditemukan", 404);
      if (model.status !== "loaded") {
        throw new ApiError(
          `Model "${model.name}" belum dimuat ke server inferensi`,
          409,
        );
      }
    }
    updateDb((data) => {
      data.streamModels[streamId] = [...new Set(modelIds)];
    });
    const stream = buildStreams().find((s) => s.id === streamId);
    if (!stream) throw new ApiError("Stream tidak ditemukan", 404);
    return clone(stream);
  },

  async setFocus() {
    await latency();
  },

  async latestDetections(streamId) {
    const db = readDb();
    const modelIds = db.streamModels[streamId] ?? [];
    const models = db.models.filter((m) => modelIds.includes(m.id));
    if (models.length === 0) return null;
    const detections = models.flatMap((m) =>
      randomDetections(
        m.key,
        m.classFilter.length > 0 ? m.classFilter : m.classes,
      ),
    );
    const groups: Record<string, number> = {};
    for (const [group, labels] of Object.entries(GROUPS)) {
      groups[group] = detections.filter((d) => labels.includes(d.label)).length;
    }
    return {
      streamId,
      modelId: modelIds[0] ?? null,
      modelIds,
      timestamp: Date.now(),
      detections,
      groups,
      timingsMs: Object.fromEntries(
        models.map((m) => [m.key, Math.round(8 + Math.random() * 12)]),
      ),
    };
  },

  subscribeCaptions(streamId, onCaption) {
    let index = Math.floor(Math.random() * CAPTIONS.length);
    const push = () => {
      const caption: Caption = {
        streamId,
        timestamp: Date.now(),
        text: CAPTIONS[index % CAPTIONS.length] ?? "",
      };
      index += 1;
      onCaption(caption);
    };
    const first = setTimeout(push, 600);
    const timer = setInterval(push, 4_500);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  },
};
