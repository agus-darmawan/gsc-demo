import type { SystemApi } from "../contracts";
import { latency } from "./db";

export const mockSystemApi: SystemApi = {
  async health() {
    const started = performance.now();
    await latency();
    return {
      ok: true,
      version: "demo",
      latencyMs: Math.round(performance.now() - started),
    };
  },
};
