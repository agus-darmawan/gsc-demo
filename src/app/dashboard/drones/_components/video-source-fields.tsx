"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { VIDEO_PROTOCOL_LABEL } from "@/constants/labels";
import { cn } from "@/lib/utils";
import { VIDEO_URL_EXAMPLE } from "@/lib/validators";
import type { VideoProtocol } from "@/types/drone";
import {
  type DroneFormErrors,
  newVideoSource,
  type VideoSourceForm,
} from "../_lib/drone-form";
import { FormSection } from "./section";

const PROTOCOLS = (Object.keys(VIDEO_PROTOCOL_LABEL) as VideoProtocol[]).map(
  (value) => ({
    value,
    label: VIDEO_PROTOCOL_LABEL[value],
  }),
);

const MAX_SOURCES = 6;

interface Props {
  sources: VideoSourceForm[];
  errors: DroneFormErrors;
  onChange: (sources: VideoSourceForm[]) => void;
}

/** One drone can carry several feeds (main, thermal, gimbal zoom…). */
export function VideoSourceFields({ sources, errors, onChange }: Props) {
  const update = (key: string, patch: Partial<VideoSourceForm>) =>
    onChange(sources.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const makePrimary = (key: string) =>
    onChange(sources.map((s) => ({ ...s, primary: s.key === key })));

  const remove = (key: string) => {
    const next = sources.filter((s) => s.key !== key);
    const first = next[0];
    if (first && !next.some((s) => s.primary)) first.primary = true;
    onChange(next);
  };

  return (
    <FormSection
      title="Sumber video"
      description="Setiap sumber menjadi stream di halaman Video. Sumber utama dipakai untuk video mini di tampilan Terbang."
    >
      {sources.map((source, index) => {
        const nameError = errors[`video.${source.key}.name`];
        const urlError = errors[`video.${source.key}.url`];
        return (
          <div
            key={source.key}
            className={cn(
              "panel-inset flex flex-col gap-2 p-2.5",
              source.primary && "border-cyan/40",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-txt-muted">
                #{index + 1}
              </span>
              <TextInput
                aria-label={`Nama sumber video ${index + 1}`}
                placeholder="Nama, mis. Kamera termal"
                value={source.name}
                invalid={!!nameError}
                onChange={(e) => update(source.key, { name: e.target.value })}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => makePrimary(source.key)}
                aria-pressed={source.primary}
                title={source.primary ? "Sumber utama" : "Jadikan sumber utama"}
                className={cn(
                  "p-1",
                  source.primary
                    ? "text-amber"
                    : "text-txt-muted hover:text-amber",
                )}
              >
                <Star
                  size={14}
                  fill={source.primary ? "currentColor" : "none"}
                />
              </button>
              <IconButton
                size="xs"
                variant="ghost"
                icon={Trash2}
                label={`Hapus sumber video ${index + 1}`}
                onClick={() => remove(source.key)}
              />
            </div>
            <div className="grid grid-cols-[130px_1fr] gap-2">
              <Select
                aria-label="Protokol video"
                value={source.protocol}
                options={PROTOCOLS}
                onChange={(protocol) => update(source.key, { protocol })}
              />
              <TextInput
                aria-label={`URL sumber video ${index + 1}`}
                placeholder={VIDEO_URL_EXAMPLE[source.protocol]}
                value={source.url}
                invalid={!!urlError}
                spellCheck={false}
                onChange={(e) => update(source.key, { url: e.target.value })}
              />
            </div>
            {(nameError || urlError) && (
              <p role="alert" className="font-mono text-[10px] text-red">
                {[nameError, urlError].filter(Boolean).join(". ")}
              </p>
            )}
          </div>
        );
      })}
      <Button
        size="xs"
        icon={Plus}
        disabled={sources.length >= MAX_SOURCES}
        onClick={() =>
          onChange([...sources, newVideoSource(sources.length === 0)])
        }
        className="self-start"
      >
        Tambah sumber video
      </Button>
    </FormSection>
  );
}
