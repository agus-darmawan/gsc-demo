"use client";

import { useEffect, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "@/constants/defaults";
import { APP_VERSION, USE_MOCK } from "@/lib/api";
import { type DesktopInfo, getDesktopInfo, isDesktop } from "@/lib/platform";
import { SettingsCard } from "./settings-card";

export function AboutSection() {
  const [desktop, setDesktop] = useState<DesktopInfo | null>(null);
  const [runtime, setRuntime] = useState<string>("--");

  useEffect(() => {
    setRuntime(isDesktop() ? "Aplikasi desktop (Tauri)" : "Browser");
    getDesktopInfo()
      .then(setDesktop)
      .catch(() => setDesktop(null));
  }, []);

  return (
    <SettingsCard title={APP_NAME} description={APP_TAGLINE}>
      <dl className="grid max-w-xl grid-cols-[160px_1fr] gap-y-2 text-xs">
        <dt className="text-txt-tertiary">Versi antarmuka</dt>
        <dd className="font-mono text-txt-primary">v{APP_VERSION}</dd>
        <dt className="text-txt-tertiary">Lingkungan</dt>
        <dd className="text-txt-primary">{runtime}</dd>
        {desktop && (
          <>
            <dt className="text-txt-tertiary">Versi desktop</dt>
            <dd className="font-mono text-txt-primary">
              v{desktop.version} ({desktop.platform})
            </dd>
          </>
        )}
        <dt className="text-txt-tertiary">Sumber data</dt>
        <dd className="text-txt-primary">
          {USE_MOCK ? "Simulasi demo" : "Server GCS"}
        </dd>
      </dl>
    </SettingsCard>
  );
}
