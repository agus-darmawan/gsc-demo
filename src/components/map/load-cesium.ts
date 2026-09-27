import type { CesiumLib } from "./types";

export const CESIUM_BASE_URL = "/cesium/";
type CesiumWindow = Window & { Cesium?: CesiumLib; CESIUM_BASE_URL?: string };
let pending: Promise<CesiumLib> | null = null;

export function loadCesium(): Promise<CesiumLib> {
  const w = window as CesiumWindow;
  if (w.Cesium) return Promise.resolve(w.Cesium);
  if (pending) return pending;
  w.CESIUM_BASE_URL = CESIUM_BASE_URL;
  pending = new Promise<CesiumLib>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${CESIUM_BASE_URL}Cesium.js`;
    s.async = true;
    s.onload = () => (w.Cesium ? resolve(w.Cesium) : reject(new Error("Cesium tidak tersedia")));
    s.onerror = () => { pending = null; s.remove(); reject(new Error(`Gagal memuat ${s.src}`)); };
    document.head.appendChild(s);
  });
  return pending;
}