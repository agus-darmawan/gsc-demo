"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import {
  canRecordAudio,
  getSpeechRecognition,
  type SpeechRecognitionLike,
  speechErrorMessage,
} from "@/lib/speech/web-speech";
import type { SttEngine, SttLanguage } from "@/types/assistant";

export type SttState = "idle" | "listening" | "processing" | "error";

interface Options {
  engine: SttEngine;
  language: SttLanguage;
  /** Receives the final transcript. */
  onFinal: (text: string) => void;
  /** Auto-stop for server recordings. */
  maxDurationMs?: number;
}

export interface SpeechToText {
  state: SttState;
  /** Live partial transcript (browser engine only). */
  interim: string;
  error: string | null;
  elapsedS: number;
  supported: boolean;
  /** Engine actually used (falls back to server when the browser lacks it). */
  activeEngine: SttEngine | null;
  start: () => void;
  stop: () => void;
  cancel: () => void;
}

function pickEngine(preferred: SttEngine): SttEngine | null {
  const browser = !!getSpeechRecognition();
  const server = canRecordAudio();
  if (preferred === "browser")
    return browser ? "browser" : server ? "server" : null;
  return server ? "server" : browser ? "browser" : null;
}

function pickMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useSpeechToText({
  engine,
  language,
  onFinal,
  maxDurationMs = 30_000,
}: Options): SpeechToText {
  const [state, setState] = useState<SttState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [elapsedS, setElapsedS] = useState(0);
  const [supported, setSupported] = useState(false);
  const [activeEngine, setActiveEngine] = useState<SttEngine | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);
  const startedAtRef = useRef(0);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(pickEngine(engine) !== null);
  }, [engine]);

  // Elapsed timer while listening.
  useEffect(() => {
    if (state !== "listening") return;
    const id = setInterval(() => {
      setElapsedS(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [state]);

  const releaseMic = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }, []);

  const startBrowser = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = "";
    recognition.onresult = (event) => {
      let partial = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result?.[0]?.transcript ?? "";
        if (result?.isFinal) finalText += `${text} `;
        else partial += text;
      }
      setInterim(`${finalText}${partial}`.trim());
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(speechErrorMessage(event.error));
      setState("error");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      const text = finalText.trim();
      setInterim("");
      if (!cancelledRef.current && text) onFinalRef.current(text);
      setState((s) => (s === "error" ? s : "idle"));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const startServer = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Akses mikrofon ditolak atau mikrofon tidak ditemukan.");
      setState("error");
      return;
    }
    streamRef.current = stream;
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      releaseMic();
      recorderRef.current = null;
      if (cancelledRef.current || chunks.length === 0) {
        setState("idle");
        return;
      }
      setState("processing");
      try {
        const audio = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });
        const result = await api.assistant.transcribe(audio, language);
        if (result.text.trim()) onFinalRef.current(result.text.trim());
        setState("idle");
      } catch (err) {
        setError(errorMessage(err));
        setState("error");
      }
    };

    recorderRef.current = recorder;
    recorder.start();
  }, [language, releaseMic]);

  const start = useCallback(() => {
    if (state === "listening" || state === "processing") return;
    const chosen = pickEngine(engine);
    if (!chosen) {
      setError("Perangkat ini tidak mendukung input suara.");
      setState("error");
      return;
    }
    cancelledRef.current = false;
    startedAtRef.current = Date.now();
    setElapsedS(0);
    setError(null);
    setInterim("");
    setActiveEngine(chosen);
    setState("listening");
    if (chosen === "browser") startBrowser();
    else void startServer();
  }, [engine, state, startBrowser, startServer]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    recognitionRef.current?.abort();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    releaseMic();
    setInterim("");
    setError(null);
    setState("idle");
  }, [releaseMic]);

  // Auto-stop long recordings.
  useEffect(() => {
    if (state !== "listening") return;
    const id = setTimeout(stop, maxDurationMs);
    return () => clearTimeout(id);
  }, [state, stop, maxDurationMs]);

  // Release everything on unmount.
  useEffect(
    () => () => {
      cancelledRef.current = true;
      recognitionRef.current?.abort();
      if (recorderRef.current?.state === "recording")
        recorderRef.current.stop();
      for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    },
    [],
  );

  return {
    state,
    interim,
    error,
    elapsedS,
    supported,
    activeEngine,
    start,
    stop,
    cancel,
  };
}
