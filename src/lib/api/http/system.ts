import { http } from "../client/http";
import type { HealthStatus, SystemApi } from "../contracts";

interface HealthBody {
  version?: string;
}

export const httpSystemApi: SystemApi = {
  async health(): Promise<HealthStatus> {
    const started = performance.now();
    const { data } = await http.get<HealthBody>("/health", { timeout: 5_000 });
    return {
      ok: true,
      version: data.version ?? null,
      latencyMs: Math.round(performance.now() - started),
    };
  },
};
