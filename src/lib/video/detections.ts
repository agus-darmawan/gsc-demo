import type { DetectionFrame } from "@/types/stream";

export interface DetectionCount {
  label: string;
  count: number;
}

/** Label counts, most frequent first. */
export function summarizeDetections(
  frame: DetectionFrame | null,
): DetectionCount[] {
  if (!frame) return [];
  const counts = new Map<string, number>();
  for (const d of frame.detections)
    counts.set(d.label, (counts.get(d.label) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
