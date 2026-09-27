"use client";

import { useEffect } from "react";
import { useModelStore } from "@/stores/use-model-store";
import { useStreamStore } from "@/stores/use-stream-store";

/** Ensures streams and detection models are loaded. */
export function useStreams() {
  const streams = useStreamStore((s) => s.streams);
  const status = useStreamStore((s) => s.status);
  const error = useStreamStore((s) => s.error);
  const load = useStreamStore((s) => s.load);
  const loadModels = useModelStore((s) => s.load);

  useEffect(() => {
    void load();
    void loadModels();
  }, [load, loadModels]);

  return {
    streams,
    loading: status === "idle" || status === "loading",
    error,
    reload: () => load(true),
  };
}
