import type { SttResult } from "@/types/assistant";
import type { Detection } from "@/types/stream";
import type { AssistantApi } from "../contracts";
import { latency } from "./db";

const SAMPLE_QUESTIONS = [
  "Berapa jumlah orang yang terlihat di frame ini?",
  "Apakah ada kendaraan yang bergerak?",
  "Jelaskan kondisi area di sekitar bangunan.",
  "Apakah ada aktivitas mencurigakan?",
];

function summarize(detections: Detection[]): string | null {
  if (detections.length === 0) return null;
  const counts = new Map<string, number>();
  for (const d of detections)
    counts.set(d.label, (counts.get(d.label) ?? 0) + 1);
  return [...counts.entries()].map(([label, n]) => `${n} ${label}`).join(", ");
}

export const mockAssistantApi: AssistantApi = {
  async askVlm({ question, detections, caption }) {
    await latency(900 + Math.random() * 900);
    const q = question.toLowerCase();
    const summary = summarize(detections);

    let answer: string;
    if (/berapa|jumlah|how many|count/.test(q)) {
      answer = summary
        ? `Pada frame ini terdeteksi ${summary}. Jumlah dapat berubah karena sebagian objek tertutup atau berada di tepi frame.`
        : "Tidak ada objek yang terdeteksi pada frame ini. Coba aktifkan model deteksi pada stream untuk hitungan yang lebih akurat.";
    } else if (/aman|bahaya|ancaman|mencurigakan|threat|suspicious/.test(q)) {
      answer = `Tidak terlihat aktivitas yang jelas mencurigakan. ${caption ?? "Situasi tampak normal."} Tetap lakukan verifikasi visual oleh operator.`;
    } else if (/kendaraan|mobil|truk|vehicle/.test(q)) {
      answer = summary
        ? `Objek terdeteksi: ${summary}. ${caption ?? ""}`.trim()
        : `Saya tidak melihat kendaraan yang terdeteksi dengan jelas. ${caption ?? ""}`.trim();
    } else {
      answer = [
        caption
          ? `Berdasarkan frame yang diambil: ${caption}`
          : "Frame berhasil dianalisis.",
        summary ? `Objek terdeteksi: ${summary}.` : null,
      ]
        .filter(Boolean)
        .join(" ");
    }
    return { answer };
  },

  async transcribe(_audio, language): Promise<SttResult> {
    await latency(700);
    const text =
      SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)] ??
      "";
    return { text, language, confidence: 0.9 };
  },
};
