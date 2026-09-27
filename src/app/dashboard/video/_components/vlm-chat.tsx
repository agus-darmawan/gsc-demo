"use client";

import { Bot, Camera, Mic, Send, Square, X } from "lucide-react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { VoiceStatus } from "@/components/assistant/voice-status";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { api, errorMessage } from "@/lib/api";
import { cn, uid } from "@/lib/utils";
import { captureFrame } from "@/lib/video/capture-frame";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { FrameSnapshot, InputMode, VlmMessage } from "@/types/assistant";
import type { Caption } from "@/types/stream";
import { SnapshotMeta, VlmMessageBubble } from "./vlm-message";

interface VlmChatProps {
  streamId: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  latestCaption: Caption | null;
}

const HISTORY_TURNS = 6;

/**
 * Visual question answering on the focused stream. The frame is either locked
 * with the camera button or captured at send time; detections and the latest
 * caption travel with it. Questions can be typed or spoken.
 */
export function VlmChat({ streamId, videoRef, latestCaption }: VlmChatProps) {
  const sttEngine = useSettingsStore((s) => s.sttEngine);
  const sttLanguage = useSettingsStore((s) => s.sttLanguage);

  const [messages, setMessages] = useState<VlmMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [draftMode, setDraftMode] = useState<InputMode>("text");
  const [locked, setLocked] = useState<FrameSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const captionRef = useRef(latestCaption);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    captionRef.current = latestCaption;
  }, [latestCaption]);

  const stt = useSpeechToText({
    engine: sttEngine,
    language: sttLanguage,
    onFinal: (text) => {
      setDraft((current) =>
        current.trim() ? `${current.trim()} ${text}` : text,
      );
      setDraftMode("voice");
      inputRef.current?.focus();
    },
  });
  const listening = stt.state === "listening";

  useEffect(() => {
    if (messages.length === 0) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const takeSnapshot = async (): Promise<FrameSnapshot | null> => {
    // Capture the pixels first, then fetch the matching AI context.
    const image = captureFrame(videoRef.current);
    if (!image) {
      setNotice("Frame belum tersedia, tunggu sampai video tampil.");
      return null;
    }
    const takenAt = Date.now();
    const caption = captionRef.current;
    const detections = await api.streams
      .latestDetections(streamId)
      .catch(() => null);
    return { image, takenAt, detections, caption };
  };

  const ask = useCallback(
    async (
      question: string,
      snapshot: FrameSnapshot,
      history: VlmMessage[],
      pendingId: string,
    ) => {
      try {
        const { answer } = await api.assistant.askVlm({
          streamId,
          question,
          image: snapshot.image,
          detections: snapshot.detections?.detections ?? [],
          caption: snapshot.caption?.text ?? null,
          history: history
            .filter((m) => !m.pending && !m.error)
            .slice(-HISTORY_TURNS)
            .map(({ role, text }) => ({ role, text })),
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? { ...m, text: answer, pending: false, timestamp: Date.now() }
              : m,
          ),
        );
      } catch (error) {
        const text = errorMessage(error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? { ...m, text, pending: false, error: true }
              : m,
          ),
        );
      }
    },
    [streamId],
  );

  const send = async () => {
    const question = draft.trim();
    if (!question || busy) return;
    if (listening) stt.stop();
    setBusy(true);
    setNotice(null);

    const snapshot = locked ?? (await takeSnapshot());
    if (!snapshot) {
      setBusy(false);
      return;
    }

    const pendingId = uid("msg");
    const history = messages;
    setMessages((prev) => [
      ...prev,
      {
        id: uid("msg"),
        role: "user",
        text: question,
        timestamp: Date.now(),
        inputMode: draftMode,
        snapshot,
      },
      {
        id: pendingId,
        role: "assistant",
        text: "",
        timestamp: Date.now(),
        pending: true,
      },
    ]);
    setDraft("");
    setDraftMode("text");
    setLocked(null);

    await ask(question, snapshot, history, pendingId);
    setBusy(false);
  };

  const retry = async (assistantId: string) => {
    const index = messages.findIndex((m) => m.id === assistantId);
    const question = messages[index - 1];
    if (index < 1 || !question?.snapshot || question.role !== "user") return;
    setBusy(true);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, text: "", pending: true, error: false }
          : m,
      ),
    );
    await ask(
      question.text,
      question.snapshot,
      messages.slice(0, index - 1),
      assistantId,
    );
    setBusy(false);
  };

  const toggleMic = () => {
    if (listening) stt.stop();
    else stt.start();
  };

  return (
    <aside
      aria-label="Asisten AI"
      className="flex min-h-0 w-96 shrink-0 flex-col border-l border-border-subtle bg-gcs-primary"
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
        <Bot size={13} className="text-violet-light" aria-hidden />
        <span className="text-xs font-semibold text-violet-light">
          Asisten AI
        </span>
        <span className="text-[10px] text-txt-muted">tanya jawab visual</span>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="ml-auto text-[11px] text-txt-muted hover:text-red"
          >
            Bersihkan
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3"
      >
        {messages.length === 0 ? (
          <div className="m-auto max-w-64 text-center text-[11px] leading-relaxed text-txt-tertiary">
            Tanyakan kondisi di video, ketik atau tekan{" "}
            <Mic size={10} className="-mt-0.5 inline" aria-label="mikrofon" />{" "}
            untuk bicara. Tekan{" "}
            <Camera size={10} className="-mt-0.5 inline" aria-label="kamera" />{" "}
            untuk mengunci frame; tanpa itu frame diambil saat pesan dikirim.
            Hasil deteksi dan deskripsi adegan ikut dikirim.
          </div>
        ) : (
          messages.map((m) => (
            <VlmMessageBubble
              key={m.id}
              message={m}
              onRetry={m.error ? () => void retry(m.id) : undefined}
            />
          ))
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border-subtle p-2">
        {locked && (
          <div className="panel-inset flex items-center gap-2 p-1">
            {/* biome-ignore lint/performance/noImgElement: data URL snapshot, nothing to optimize */}
            <img
              src={locked.image}
              alt="Frame terkunci"
              className="aspect-video w-16 border border-border-subtle object-cover"
            />
            <div className="flex min-w-0 flex-col">
              <span className="text-[11px] font-semibold text-cyan">
                Frame dikunci
              </span>
              <SnapshotMeta snapshot={locked} />
            </div>
            <button
              type="button"
              onClick={() => setLocked(null)}
              aria-label="Buang frame"
              className="ml-auto p-1 text-txt-muted hover:text-red"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <VoiceStatus stt={stt} />
        {notice && <p className="px-1 text-[11px] text-amber">{notice}</p>}

        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={async () => {
              setNotice(null);
              const snapshot = await takeSnapshot();
              if (snapshot) setLocked(snapshot);
            }}
            disabled={busy}
            aria-label={locked ? "Ambil ulang frame" : "Kunci frame saat ini"}
            title={locked ? "Ambil ulang frame" : "Kunci frame saat ini"}
            className={cn(
              "border p-2 transition-colors disabled:opacity-40",
              locked
                ? "border-cyan/60 bg-cyan/15 text-cyan"
                : "border-border-subtle text-txt-muted hover:text-cyan",
            )}
          >
            <Camera size={14} />
          </button>

          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (!e.target.value) setDraftMode("text");
            }}
            onKeyDown={(e) => {
              if (e.altKey && e.key.toLowerCase() === "m") {
                e.preventDefault();
                toggleMic();
                return;
              }
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            aria-label="Pertanyaan untuk asisten AI"
            placeholder="Ada berapa orang di dekat truk?"
            className="flex-1 resize-none border border-border-subtle bg-gcs-root px-2 py-1.5 text-xs text-txt-primary outline-none placeholder:text-txt-muted focus:border-cyan/60"
          />

          <button
            type="button"
            onClick={toggleMic}
            disabled={!stt.supported || stt.state === "processing"}
            aria-pressed={listening}
            aria-label={listening ? "Hentikan input suara" : "Bicara (Alt+M)"}
            title={
              stt.supported
                ? listening
                  ? "Hentikan input suara"
                  : "Bicara (Alt+M)"
                : "Perangkat tidak mendukung input suara"
            }
            className={cn(
              "border p-2 transition-colors disabled:opacity-40",
              listening
                ? "border-red/60 bg-red/15 text-red"
                : "border-border-subtle text-txt-muted hover:text-cyan",
            )}
          >
            {listening ? <Square size={14} /> : <Mic size={14} />}
          </button>

          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !draft.trim()}
            aria-label="Kirim"
            title="Kirim"
            className="border border-violet/60 bg-violet/15 p-2 text-violet-light transition-colors hover:bg-violet/25 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>

        <span className="px-1 font-mono text-[9px] text-txt-muted">
          {locked ? "Memakai frame terkunci" : "Frame diambil saat kirim"}.
          Enter kirim, Shift+Enter baris baru, Alt+M bicara.
        </span>
      </div>
    </aside>
  );
}
