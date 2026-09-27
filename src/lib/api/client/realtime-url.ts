import { API_URL, WS_URL } from "./config";

/**
 * Browsers cannot attach headers to WebSocket / EventSource requests, so the
 * bearer token is passed as the `access_token` query parameter instead.
 */
export function realtimeUrl(
  path: string,
  kind: "ws" | "sse",
  token: string | null,
): string {
  const base = kind === "ws" ? WS_URL : API_URL;
  const origin =
    typeof window === "undefined" ? "http://localhost" : window.location.href;
  const url = new URL(`${base}${path}`, origin);
  if (token) url.searchParams.set("access_token", token);
  return url.toString();
}
