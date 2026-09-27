"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { VoiceStatus } from "@/components/assistant/voice-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { canRecordAudio, getSpeechRecognition } from "@/lib/speech/web-speech";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { SttEngine, SttLanguage } from "@/types/assistant";
import { SettingsCard } from "./settings-card";

const ENGINE_OPTIONS: { value: SttEngine; label: string }[] = [
  { value: "browser", label: "Browser" },
  { value: "server", label: "Server" },
];

const LANGUAGE_OPTIONS: { value: SttLanguage; label: string }[] = [
  { value: "id-ID", label: "Bahasa Indonesia" },
  { value: "en-US", label: "English (US)" },
];

export function AssistantSection() {
  const engine = useSettingsStore((s) => s.sttEngine);
  const language = useSettingsStore((s) => s.sttLanguage);
  const update = useSettingsStore((s) => s.update);
  const [support, setSupport] = useState<{
    browser: boolean;
    server: boolean;
  } | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const stt = useSpeechToText({ engine, language, onFinal: setResult });
  const listening = stt.state === "listening";

  useEffect(() => {
    setSupport({ browser: !!getSpeechRecognition(), server: canRecordAudio() });
  }, []);

  return (
    <SettingsCard
      title="Input suara (speech-to-text)"
      description="Dipakai untuk bertanya ke asisten AI di mode fokus video."
    >
      <div className="grid max-w-xl grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="label">Mesin pengenalan suara</span>
          <Segmented
            ariaLabel="Mesin STT"
            value={engine}
            options={ENGINE_OPTIONS}
            onChange={(sttEngine) => update({ sttEngine })}
          />
          <p className="text-[11px] leading-snug text-txt-tertiary">
            {engine === "browser"
              ? "Web Speech API bawaan browser. Butuh internet (Chrome/Edge)."
              : "Audio direkam lalu ditranskripsi server (mis. Whisper). Bisa luring."}
          </p>
        </div>
        <Field label="Bahasa">
          <Select
            value={language}
            options={LANGUAGE_OPTIONS}
            onChange={(sttLanguage) => update({ sttLanguage })}
          />
        </Field>
      </div>

      {support && (
        <div className="flex gap-2">
          <Badge tone={support.browser ? "success" : "neutral"}>
            Browser {support.browser ? "tersedia" : "tidak tersedia"}
          </Badge>
          <Badge tone={support.server ? "success" : "neutral"}>
            Perekaman {support.server ? "tersedia" : "tidak tersedia"}
          </Badge>
        </div>
      )}

      <div className="flex max-w-xl flex-col gap-2 border-t border-border-subtle pt-4">
        <span className="label">Tes mikrofon</span>
        <div className="flex items-center gap-2">
          <Button
            icon={listening ? Square : Mic}
            variant={listening ? "danger" : "secondary"}
            disabled={!stt.supported || stt.state === "processing"}
            onClick={() => {
              if (listening) stt.stop();
              else {
                setResult(null);
                stt.start();
              }
            }}
          >
            {listening ? "Selesai" : "Mulai bicara"}
          </Button>
          {stt.activeEngine && (
            <span className="text-[11px] text-txt-tertiary">
              Mesin: {stt.activeEngine === "browser" ? "browser" : "server"}
            </span>
          )}
        </div>
        <VoiceStatus stt={stt} />
        {result && (
          <p className="panel-inset px-3 py-2 text-xs text-txt-primary">
            <span className="mr-2 text-txt-tertiary">Hasil:</span>
            {result}
          </p>
        )}
      </div>
    </SettingsCard>
  );
}
