import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "./config";
import { toApiError } from "./errors";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Do not clear the session when this request returns 401 (e.g. login). */
    skipAuthHandling?: boolean;
  }
}

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => undefined;

/**
 * Connects the auth store to the HTTP layer. Called once by the auth store,
 * which keeps the dependency one-directional (store -> http).
 */
export function configureHttpAuth(options: {
  getToken: TokenGetter;
  onUnauthorized: UnauthorizedHandler;
}): void {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

export function currentToken(): string | null {
  return getToken();
}

/** Shared axios instance. Every REST call goes through here. */
export const http: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    const skip = axios.isAxiosError(error) && error.config?.skipAuthHandling;
    if (apiError.status === 401 && !skip) onUnauthorized();
    return Promise.reject(apiError);
  },
);
