"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Caption } from "@/types/stream";

/** Live scene descriptions, newest first. */
export function useCaptions(streamId: string, max = 20): Caption[] {
  const [captions, setCaptions] = useState<Caption[]>([]);

  useEffect(() => {
    setCaptions([]);
    return api.streams.subscribeCaptions(streamId, (caption) =>
      setCaptions((prev) => [caption, ...prev].slice(0, max)),
    );
  }, [streamId, max]);

  return captions;
}
