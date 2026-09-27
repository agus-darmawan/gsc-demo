"use client";

import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/use-settings-store";
import { MAP_LAYER_OPTIONS } from "./map-layers";

export function LayerSwitcher({ className }: { className?: string }) {
  const layer = useSettingsStore((s) => s.mapLayer);
  const update = useSettingsStore((s) => s.update);

  return (
    <fieldset
      aria-label="Lapisan peta"
      className={cn("hud-panel flex items-center", className)}
    >
      <Layers size={12} className="mx-2 text-txt-tertiary" aria-hidden />
      {MAP_LAYER_OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={layer === id}
          onClick={() => update({ mapLayer: id })}
          className={cn(
            "h-7 px-2.5 font-mono text-[10px] font-semibold transition-colors",
            layer === id
              ? "bg-cyan/15 text-cyan"
              : "text-txt-tertiary hover:text-txt-secondary",
          )}
        >
          {label}
        </button>
      ))}
    </fieldset>
  );
}
