"use client";

import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { formatLatLon } from "@/lib/geo";
import type { CoordMode, DropFormValues } from "../_lib/drop-form";
import { formPosition, switchCoordMode } from "../_lib/drop-form";

interface CoordinateInputProps {
  values: DropFormValues;
  error?: string;
  picking: boolean;
  onChange: (values: DropFormValues) => void;
  onTogglePick: () => void;
}

const MODES = [
  { value: "dd" as CoordMode, label: "Desimal" },
  { value: "mgrs" as CoordMode, label: "MGRS" },
];

/** Target coordinates: typed (decimal / MGRS) or picked on the map. */
export function CoordinateInput({
  values,
  error,
  picking,
  onChange,
  onTogglePick,
}: CoordinateInputProps) {
  const position = formPosition(values);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="label">
          Koordinat target<span className="ml-0.5 text-red">*</span>
        </span>
        <Segmented
          ariaLabel="Format input koordinat"
          value={values.coordMode}
          options={MODES}
          onChange={(mode) => onChange(switchCoordMode(values, mode))}
          className="w-36"
        />
      </div>

      {values.coordMode === "dd" ? (
        <div className="grid grid-cols-2 gap-2">
          <TextInput
            aria-label="Lintang"
            placeholder="Lintang, mis. -6.2088"
            inputMode="decimal"
            value={values.lat}
            invalid={!!error}
            onChange={(e) => onChange({ ...values, lat: e.target.value })}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              const match = text.match(
                /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/,
              );
              if (match?.[1] && match[2]) {
                e.preventDefault();
                onChange({ ...values, lat: match[1], lon: match[2] });
              }
            }}
          />
          <TextInput
            aria-label="Bujur"
            placeholder="Bujur, mis. 106.8456"
            inputMode="decimal"
            value={values.lon}
            invalid={!!error}
            onChange={(e) => onChange({ ...values, lon: e.target.value })}
          />
        </div>
      ) : (
        <TextInput
          aria-label="Koordinat MGRS"
          placeholder="48M YU 02178 17060"
          value={values.mgrs}
          invalid={!!error}
          onChange={(e) =>
            onChange({ ...values, mgrs: e.target.value.toUpperCase() })
          }
          className="uppercase"
        />
      )}

      <Button
        size="sm"
        icon={Crosshair}
        variant={picking ? "primary" : "secondary"}
        aria-pressed={picking}
        onClick={onTogglePick}
      >
        {picking ? "Klik lokasi target di peta…" : "Pilih di peta"}
      </Button>

      {error ? (
        <p role="alert" className="font-mono text-[10px] text-red">
          {error}
        </p>
      ) : (
        position && (
          <div className="panel-inset flex flex-col gap-0.5 px-2 py-1.5 font-mono text-[10px] text-txt-tertiary">
            <span>{formatLatLon(position, "dms")}</span>
            <span>
              {values.coordMode === "mgrs"
                ? formatLatLon(position, "dd")
                : formatLatLon(position, "mgrs")}
            </span>
          </div>
        )
      )}
    </div>
  );
}
