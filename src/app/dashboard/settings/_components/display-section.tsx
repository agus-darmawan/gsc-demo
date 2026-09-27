"use client";

import { RotateCcw, Volume2 } from "lucide-react";
import { MAP_LAYER_OPTIONS } from "@/components/map/map-layers";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DEMO_BASE } from "@/constants/defaults";
import { COORDINATE_FORMAT_LABEL, SPEED_UNIT_LABEL } from "@/constants/labels";
import { playAlertTone } from "@/lib/audio";
import { formatLatLon } from "@/lib/geo";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { CoordinateFormat } from "@/types/geo";
import type { MapLayerId, SpeedUnit } from "@/types/settings";
import { SettingsCard } from "./settings-card";

const COORD_OPTIONS = (
  Object.keys(COORDINATE_FORMAT_LABEL) as CoordinateFormat[]
).map((value) => ({
  value,
  label: COORDINATE_FORMAT_LABEL[value],
}));
const SPEED_OPTIONS = (Object.keys(SPEED_UNIT_LABEL) as SpeedUnit[]).map(
  (value) => ({ value, label: SPEED_UNIT_LABEL[value] }),
);
const LAYER_OPTIONS = MAP_LAYER_OPTIONS.map(({ id, label }) => ({
  value: id as MapLayerId,
  label,
}));

export function DisplaySection() {
  const settings = useSettingsStore();

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="Koordinat dan satuan"
        description="Berlaku di peta, panel drone, titik drop dan rencana misi."
      >
        <div className="grid max-w-lg grid-cols-2 gap-3">
          <Field
            label="Format koordinat"
            hint={`Contoh: ${formatLatLon(DEMO_BASE, settings.coordinateFormat)}`}
          >
            <Select
              value={settings.coordinateFormat}
              options={COORD_OPTIONS}
              onChange={(coordinateFormat) =>
                settings.update({ coordinateFormat })
              }
            />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="label">Satuan kecepatan</span>
            <Segmented
              ariaLabel="Satuan kecepatan"
              value={settings.speedUnit}
              options={SPEED_OPTIONS}
              onChange={(speedUnit) => settings.update({ speedUnit })}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Peta"
        description="Lapisan dasar peta. Untuk jaringan tertutup, arahkan sumber tile ke server peta lokal."
      >
        <div className="flex max-w-xs flex-col gap-1">
          <span className="label">Lapisan default</span>
          <Segmented
            ariaLabel="Lapisan peta"
            value={settings.mapLayer}
            options={LAYER_OPTIONS}
            onChange={(mapLayer) => settings.update({ mapLayer })}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Peringatan">
        <div className="flex max-w-lg items-start gap-4">
          <Switch
            checked={settings.alertSound}
            onChange={(alertSound) => settings.update({ alertSound })}
            label="Bunyi peringatan kritis"
            description="Nada pendek saat ada kejadian kritis, mis. link putus atau baterai kritis."
          />
          <Button size="xs" icon={Volume2} onClick={playAlertTone}>
            Tes suara
          </Button>
        </div>
      </SettingsCard>

      <Button
        variant="ghost"
        icon={RotateCcw}
        className="self-start"
        onClick={settings.reset}
      >
        Kembalikan pengaturan tampilan ke bawaan
      </Button>
    </div>
  );
}
