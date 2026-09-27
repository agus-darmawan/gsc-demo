"use client";

import { useEffect, useState } from "react";
import { APP_TAGLINE } from "@/constants/defaults";
import { useSystemInfo } from "@/hooks/use-system-info";

const val = (v: number | null, suffix = "") =>
  v === null ? "--" : `${v}${suffix}`;

export function Footer() {
  const [now, setNow] = useState<string | null>(null);
  const sys = useSystemInfo();

  useEffect(() => {
    const tick = () =>
      setNow(new Date().toUTCString().split(" ").slice(1, 5).join(" "));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const degraded = (sys.pingMs ?? 0) > 200 || (sys.cpuLoad ?? 0) > 80;
  const status = !sys.online
    ? { label: "OFFLINE", cls: "text-red" }
    : degraded
      ? { label: "SISTEM TERBEBANI", cls: "text-amber" }
      : { label: "SISTEM NORMAL", cls: "text-green" };

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border-subtle bg-gcs-primary px-4 font-mono text-[10px] text-txt-muted">
      <span className="truncate">{APP_TAGLINE}</span>
      <div className="flex items-center gap-4 whitespace-nowrap tabular-nums">
        <span>PING {val(sys.pingMs, " ms")}</span>
        <span className="hidden lg:inline">
          ↓ {val(sys.downloadMbps)} ↑ {val(sys.uploadMbps)} Mbps
        </span>
        <span>CPU {val(sys.cpuLoad, "%")}</span>
        <span>MEM {val(sys.memoryUsage, "%")}</span>
        <span>UTC {now ?? "--"}</span>
        <span className={status.cls}>{status.label}</span>
      </div>
    </footer>
  );
}
