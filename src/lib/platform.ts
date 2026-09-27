export interface DesktopInfo {
  version: string;
  platform: string;
}

/** True when running inside the Tauri desktop shell. */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Reads app info from the Rust side. Returns null in the browser. */
export async function getDesktopInfo(): Promise<DesktopInfo | null> {
  if (!isDesktop()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<DesktopInfo>("app_info");
}
