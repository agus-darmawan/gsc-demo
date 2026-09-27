/**
 * Minimal typings for the Web Speech API (not part of lib.dom). Chromium
 * exposes it as `webkitSpeechRecognition`; it needs an internet connection.
 */

interface SpeechAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechAlternative;
}

interface SpeechResultList {
  readonly length: number;
  readonly [index: number]: SpeechResult;
}

export interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
}

export interface SpeechRecognitionErrorLike extends Event {
  readonly error: string;
}

export interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canRecordAudio(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

const ERROR_MESSAGE: Record<string, string> = {
  "not-allowed": "Akses mikrofon ditolak. Izinkan mikrofon di pengaturan.",
  "service-not-allowed":
    "Akses mikrofon ditolak. Izinkan mikrofon di pengaturan.",
  "no-speech":
    "Tidak ada suara terdeteksi. Coba bicara lebih dekat ke mikrofon.",
  "audio-capture": "Mikrofon tidak ditemukan.",
  network: "Layanan suara browser butuh internet. Gunakan mesin STT server.",
  "language-not-supported": "Bahasa tidak didukung oleh browser.",
};

export function speechErrorMessage(code: string): string {
  return ERROR_MESSAGE[code] ?? "Pengenalan suara gagal.";
}
