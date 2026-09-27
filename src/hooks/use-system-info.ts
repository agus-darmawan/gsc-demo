"use client";

import { useEffect, useRef, useState } from "react";

export type SystemInfo = {
  online: boolean;
  pingMs: number | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  cpuLoad: number | null;
  memoryUsage: number | null;
};

type PerfMem = { usedJSHeapSize: number; jsHeapSizeLimit: number };

const SPEED_URL = "https://speed.cloudflare.com";
const DL_BYTES = 1_000_000;
const UL_BYTES = 250_000;

async function measureDownload() {
  const t0 = performance.now();
  const res = await fetch(
    `${SPEED_URL}/__down?bytes=${DL_BYTES}&_=${Date.now()}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  const buf = await res.arrayBuffer();
  return +(
    (buf.byteLength * 8) /
    ((performance.now() - t0) / 1000) /
    1e6
  ).toFixed(1);
}

async function measureUpload() {
  const body = new Blob([new Uint8Array(UL_BYTES)], { type: "text/plain" });
  const t0 = performance.now();
  await fetch(`${SPEED_URL}/__up?_=${Date.now()}`, {
    method: "POST",
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  return +((UL_BYTES * 8) / ((performance.now() - t0) / 1000) / 1e6).toFixed(1);
}

export function useSystemInfo(
  pingUrl = "/favicon.ico",
  intervalMs = 3000,
  speedIntervalMs = 60000,
) {
  const [info, setInfo] = useState<SystemInfo>({
    online: true,
    pingMs: null,
    downloadMbps: null,
    uploadMbps: null,
    cpuLoad: null,
    memoryUsage: null,
  });
  const cpu = useRef(0);

  // CPU estimate via event-loop lag
  useEffect(() => {
    const TICK = 200;
    let expected = performance.now() + TICK;
    const id = setInterval(() => {
      const now = performance.now();
      const lag = document.hidden ? 0 : Math.max(0, now - expected);
      expected = now + TICK;
      cpu.current = cpu.current * 0.8 + Math.min(100, (lag / TICK) * 100) * 0.2;
    }, TICK);
    return () => clearInterval(id);
  }, []);

  // Ping / CPU / MEM
  useEffect(() => {
    const update = async () => {
      let pingMs: number | null = null;
      if (navigator.onLine) {
        try {
          const t0 = performance.now();
          await fetch(`${pingUrl}?_=${Date.now()}`, {
            method: "HEAD",
            cache: "no-store",
            signal: AbortSignal.timeout(2000),
          });
          pingMs = Math.round(performance.now() - t0);
        } catch {}
      }
      const mem = (performance as Performance & { memory?: PerfMem }).memory;
      setInfo((p) => ({
        ...p,
        online: navigator.onLine,
        pingMs,
        cpuLoad: Math.round(cpu.current),
        memoryUsage: mem
          ? Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100)
          : null,
      }));
    };
    update();
    const id = setInterval(update, intervalMs);
    return () => clearInterval(id);
  }, [pingUrl, intervalMs]);

  // Download / Upload
  useEffect(() => {
    const run = async () => {
      if (!navigator.onLine || document.hidden) return;
      const downloadMbps = await measureDownload().catch(() => null);
      const uploadMbps = await measureUpload().catch(() => null);
      setInfo((p) => ({ ...p, downloadMbps, uploadMbps }));
    };
    run();
    const id = setInterval(run, speedIntervalMs);
    return () => clearInterval(id);
  }, [speedIntervalMs]);

  return info;
}
