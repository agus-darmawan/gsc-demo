import { USE_MOCK } from "./client/config";
import type { GcsApi } from "./contracts";
import { createHttpApi } from "./http";
import { createMockApi } from "./mock";

/**
 * Single entry point for backend access. Components and stores depend on the
 * `GcsApi` interface only; the implementation is chosen at build time.
 */
export const api: GcsApi = USE_MOCK ? createMockApi() : createHttpApi();

export { API_URL, APP_VERSION, USE_MOCK, WS_URL } from "./client/config";
export { ApiError, errorMessage, isCancelled } from "./client/errors";
export type * from "./contracts";
