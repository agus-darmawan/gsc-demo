"use client";

import { Activity, DatabaseZap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  API_URL,
  api,
  errorMessage,
  type HealthStatus,
  USE_MOCK,
  WS_URL,
} from "@/lib/api";
import { resetMockDatabase } from "@/lib/api/mock";
import { useAppStore } from "@/stores/use-app-store";
import { SettingsCard } from "./settings-card";

const REALTIME_LABEL = {
  open: "Terhubung",
  connecting: "Menyambung",
  closed: "Terputus",
} as const;

export function ConnectionSection() {
  const realtime = useAppStore((s) => s.realtime);
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const test = async () => {
    setTesting(true);
    setError(null);
    setHealth(null);
    try {
      setHealth(await api.system.health());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="Server"
        description="Alamat ditetapkan saat build melalui NEXT_PUBLIC_API_URL dan NEXT_PUBLIC_WS_URL."
      >
        <dl className="grid max-w-2xl grid-cols-[160px_1fr] gap-y-2 text-xs">
          <dt className="text-txt-tertiary">Mode</dt>
          <dd>
            {USE_MOCK ? (
              <Badge tone="violet">Demo, simulasi di browser</Badge>
            ) : (
              <Badge tone="info">Server</Badge>
            )}
          </dd>
          <dt className="text-txt-tertiary">REST API</dt>
          <dd className="font-mono break-all text-txt-primary">
            {API_URL || "--"}
          </dd>
          <dt className="text-txt-tertiary">Realtime (WebSocket)</dt>
          <dd className="font-mono break-all text-txt-primary">
            {WS_URL || "--"}
          </dd>
          <dt className="text-txt-tertiary">Status realtime</dt>
          <dd className="text-txt-primary">{REALTIME_LABEL[realtime]}</dd>
        </dl>
        <div className="flex items-center gap-3">
          <Button icon={Activity} loading={testing} onClick={test}>
            Uji koneksi
          </Button>
          {health && (
            <span className="text-xs text-green">
              Server merespons dalam {health.latencyMs} ms
              {health.version ? ` (versi ${health.version})` : ""}
            </span>
          )}
          {error && <span className="text-xs text-red">{error}</span>}
        </div>
      </SettingsCard>

      {USE_MOCK && (
        <SettingsCard
          title="Data demo"
          description="Drone, model, rencana misi dan titik drop demo tersimpan di browser ini."
        >
          <Button
            variant="warning"
            icon={DatabaseZap}
            className="self-start"
            onClick={() => setConfirmReset(true)}
          >
            Reset data demo
          </Button>
        </SettingsCard>
      )}

      <ConfirmDialog
        open={confirmReset}
        tone="warning"
        title="Reset data demo?"
        message="Semua perubahan demo (drone, model, misi, titik drop, kata sandi) dikembalikan ke kondisi awal dan halaman dimuat ulang."
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetMockDatabase();
          window.location.reload();
        }}
      />
    </div>
  );
}
