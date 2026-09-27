"use client";

import { useSearchParams } from "next/navigation";
import { Redirect } from "@/components/providers/redirect";
import { VIDEO_BASE } from "../_lib/routes";
import { StreamFocus } from "./stream-focus";

export function FocusRoute() {
  const streamId = useSearchParams().get("stream");
  if (!streamId) return <Redirect to={VIDEO_BASE} />;
  return <StreamFocus streamId={streamId} />;
}
