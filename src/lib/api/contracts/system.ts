export interface HealthStatus {
  ok: boolean;
  version: string | null;
  latencyMs: number;
}

export interface SystemApi {
  /** GET /health */
  health(): Promise<HealthStatus>;
}
