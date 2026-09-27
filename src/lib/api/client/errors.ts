import axios from "axios";

/** Normalized error thrown by every API call. `message` is operator-facing. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string | null;

  constructor(
    message: string,
    status: number | null = null,
    code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  message?: unknown;
  detail?: unknown;
  code?: unknown;
}

const STATUS_MESSAGE: Record<number, string> = {
  400: "Permintaan tidak valid",
  401: "Sesi berakhir, silakan masuk kembali",
  403: "Anda tidak memiliki akses untuk tindakan ini",
  404: "Data tidak ditemukan",
  409: "Data sudah ada",
  413: "Ukuran file terlalu besar",
  422: "Data yang dikirim tidak valid",
  429: "Terlalu banyak permintaan, coba lagi sebentar",
};

function statusMessage(status: number): string {
  return (
    STATUS_MESSAGE[status] ??
    (status >= 500
      ? "Server sedang bermasalah"
      : `Permintaan gagal (${status})`)
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError("Permintaan dibatalkan", null, "cancelled");
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const body = error.response?.data as ErrorBody | undefined;
    const serverMessage =
      typeof body?.message === "string"
        ? body.message
        : typeof body?.detail === "string"
          ? body.detail
          : null;
    const code =
      typeof body?.code === "string" ? body.code : (error.code ?? null);

    if (status === null) {
      const timeout = error.code === "ECONNABORTED";
      return new ApiError(
        timeout
          ? "Server tidak merespons (timeout)"
          : "Tidak dapat terhubung ke server",
        null,
        code,
      );
    }
    return new ApiError(serverMessage ?? statusMessage(status), status, code);
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError("Permintaan dibatalkan", null, "cancelled");
  }
  if (error instanceof Error) return new ApiError(error.message);
  return new ApiError("Terjadi kesalahan yang tidak diketahui");
}

/** Operator-facing message for any thrown value. */
export function errorMessage(error: unknown): string {
  return toApiError(error).message;
}

export function isCancelled(error: unknown): boolean {
  return toApiError(error).code === "cancelled";
}
