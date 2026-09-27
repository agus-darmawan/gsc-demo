const trimUrl = (value: string | undefined): string =>
  (value ?? "").trim().replace(/\/+$/, "");

/** REST base URL, e.g. https://gcs.example.mil/api */
export const API_URL = trimUrl(process.env.NEXT_PUBLIC_API_URL);

/** Realtime base URL. Falls back to the API URL with a ws(s) scheme. */
export const WS_URL =
  trimUrl(process.env.NEXT_PUBLIC_WS_URL) || API_URL.replace(/^http/i, "ws");

/** Demo mode: no backend, everything is simulated in the browser. */
export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" || API_URL === "";

export const APP_VERSION = "0.2.0";
