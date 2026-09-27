"use client";

import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { connectWhep, isFileUrl } from "@/lib/video/whep";

type Status = "connecting" | "playing" | "error" | "offline";

interface StreamPlayerProps {
  url: string;
  online?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  ref?: Ref<HTMLVideoElement | null>;
}

const RETRY_MS = 3000;

const OVERLAY: Record<Exclude<Status, "playing">, string> = {
  offline: "OFFLINE",
  error: "TIDAK ADA SINYAL, MENCOBA LAGI",
  connecting: "MENYAMBUNG…",
};

/** WHEP / file player with automatic reconnect. */
export function StreamPlayer({
  url,
  online = true,
  fit = "cover",
  className,
  ref,
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useImperativeHandle<HTMLVideoElement | null, HTMLVideoElement | null>(
    ref,
    () => videoRef.current,
    [],
  );

  const [status, setStatus] = useState<Status>("connecting");
  const file = isFileUrl(url);

  // Reconnect whenever the URL changes (e.g. a different model is applied).
  useEffect(() => {
    const video = videoRef.current;
    setStatus(online ? "connecting" : "offline");
    if (!video || !online || file) return;

    let pc: RTCPeerConnection | null = null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const retry = () => {
      if (cancelled) return;
      setStatus("error");
      pc?.close();
      pc = null;
      timer = setTimeout(connect, RETRY_MS);
    };

    const connect = () => {
      setStatus("connecting");
      connectWhep(url, video)
        .then((peer) => {
          if (cancelled) {
            peer.close();
            return;
          }
          pc = peer;
          peer.onconnectionstatechange = () => {
            if (
              peer.connectionState === "failed" ||
              peer.connectionState === "disconnected"
            )
              retry();
          };
        })
        .catch(retry);
    };

    connect();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      pc?.close();
      video.srcObject = null;
    };
  }, [url, online, file]);

  const overlay = status === "playing" ? null : OVERLAY[status];

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-black",
        className,
      )}
    >
      <video
        ref={videoRef}
        src={online && file ? url : undefined}
        autoPlay
        muted
        playsInline
        loop={file}
        crossOrigin={file ? "anonymous" : undefined}
        onPlaying={() => setStatus("playing")}
        onError={() => file && setStatus("error")}
        className={cn(
          "h-full w-full",
          fit === "cover" ? "object-cover" : "object-contain",
        )}
      />
      {overlay && (
        <div className="grid-overlay absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-mono text-[10px] tracking-wider",
              status === "error" ? "text-amber" : "text-txt-muted",
            )}
          >
            {overlay}
          </span>
        </div>
      )}
    </div>
  );
}
