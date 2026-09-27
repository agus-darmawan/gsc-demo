import type { SttEngine, SttLanguage } from "./assistant";
import type { CoordinateFormat } from "./geo";

export type SpeedUnit = "ms" | "kmh" | "kn";
export type MapLayerId = "satellite" | "street" | "dark" | "offline";

export interface AppSettings {
  coordinateFormat: CoordinateFormat;
  speedUnit: SpeedUnit;
  mapLayer: MapLayerId;
  sttEngine: SttEngine;
  sttLanguage: SttLanguage;
  /** Play a short tone for critical events. */
  alertSound: boolean;
}
