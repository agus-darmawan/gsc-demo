"use client";

import { type RefObject, useEffect, useState } from "react";
import type { DetectionFrame } from "@/types/stream";

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Area actually covered by an object-contain video inside its element. */
function videoRect(video: HTMLVideoElement): Box | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cw = video.clientWidth;
  const ch = video.clientHeight;
  if (!vw || !vh || !cw || !ch) return null;
  const scale = Math.min(cw / vw, ch / vh);
  const width = vw * scale;
  const height = vh * scale;
  return { left: (cw - width) / 2, top: (ch - height) / 2, width, height };
}

/** Bounding boxes drawn over the focused video. */
export function DetectionOverlay({
  frame,
  videoRef,
}: {
  frame: DetectionFrame | null;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const [rect, setRect] = useState<Box | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => setRect(videoRect(video));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(video);
    video.addEventListener("loadedmetadata", update);
    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", update);
    };
  }, [videoRef]);

  if (!frame || !rect || frame.detections.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    >
      {frame.detections.map((d, i) => {
        const [x1, y1, x2, y2] = d.bbox;
        return (
          <div
            key={`${d.trackId ?? i}-${d.label}`}
            className="absolute border border-violet-light"
            style={{
              left: `${x1 * 100}%`,
              top: `${y1 * 100}%`,
              width: `${(x2 - x1) * 100}%`,
              height: `${(y2 - y1) * 100}%`,
            }}
          >
            <span className="absolute -top-4 left-0 bg-violet px-1 font-mono text-[9px] leading-4 whitespace-nowrap text-white">
              {d.label} {Math.round(d.confidence * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
