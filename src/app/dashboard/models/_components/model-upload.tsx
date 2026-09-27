"use client";

import { FileBox, Upload, X } from "lucide-react";
import { type DragEvent, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TextArea, TextInput } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MODEL_FORMAT_LABEL } from "@/constants/labels";
import { api, errorMessage, isCancelled } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/stores/use-model-store";
import type { UploadProgress } from "@/types/model";
import {
  defaultModelName,
  detectFormat,
  MAX_MODEL_BYTES,
  MODEL_ACCEPT,
  parseClasses,
} from "../_lib/model-file";

/** Drag & drop upload of detection weights with progress and cancel. */
export function ModelUpload() {
  const upsert = useModelStore((s) => s.upsert);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [classes, setClasses] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploading = progress !== null;
  const format = file ? detectFormat(file.name) : null;

  const choose = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!detectFormat(candidate.name)) {
      setError("Format tidak didukung. Gunakan .pt, .onnx atau .engine.");
      return;
    }
    if (candidate.size > MAX_MODEL_BYTES) {
      setError(`Ukuran file melebihi ${formatBytes(MAX_MODEL_BYTES)}.`);
      return;
    }
    setError(null);
    setFile(candidate);
    setName((current) => current || defaultModelName(candidate.name));
  };

  const reset = () => {
    setFile(null);
    setName("");
    setDescription("");
    setClasses("");
    setError(null);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (!uploading) choose(e.dataTransfer.files[0]);
  };

  const upload = async () => {
    if (!file) return;
    if (!name.trim()) {
      setError("Nama model wajib diisi.");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setProgress({ loaded: 0, total: file.size, percent: 0 });
    try {
      const model = await api.models.upload(
        {
          file,
          name: name.trim(),
          description: description.trim() || null,
          classes: parseClasses(classes),
        },
        setProgress,
        controller.signal,
      );
      upsert(model);
      toast.success(
        `Model "${model.name}" diunggah`,
        "Tekan Muat untuk mengaktifkannya di server inferensi.",
      );
      reset();
    } catch (err) {
      if (isCancelled(err)) toast.info("Unggahan dibatalkan");
      else setError(errorMessage(err));
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  };

  return (
    <section
      aria-label="Unggah model"
      className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border-subtle bg-gcs-primary p-4"
    >
      <div>
        <h2 className="text-sm font-semibold">Unggah model deteksi</h2>
        <p className="mt-1 text-xs leading-relaxed text-txt-secondary">
          File disimpan di folder model server lalu dimuat oleh layanan
          inferensi Python.
        </p>
      </div>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 border border-dashed px-4 py-7 text-center transition-colors",
          dragOver
            ? "border-cyan bg-cyan/10"
            : "border-border hover:border-border-strong",
          uploading && "pointer-events-none opacity-50",
        )}
      >
        <Upload
          size={20}
          className={dragOver ? "text-cyan" : "text-txt-tertiary"}
          aria-hidden
        />
        <span className="text-xs text-txt-primary">
          Seret file ke sini atau klik untuk memilih
        </span>
        <span className="font-mono text-[10px] text-txt-tertiary">
          .pt, .onnx, .engine, maks. {formatBytes(MAX_MODEL_BYTES)}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={MODEL_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>

      {file && (
        <div className="panel-inset flex items-center gap-2.5 px-3 py-2">
          <FileBox size={16} className="shrink-0 text-cyan" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] text-txt-primary">
              {file.name}
            </p>
            <p className="font-mono text-[10px] text-txt-tertiary">
              {formatBytes(file.size)}
            </p>
          </div>
          {format && <Badge tone="info">{MODEL_FORMAT_LABEL[format]}</Badge>}
          {!uploading && (
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Hapus file"
              className="text-txt-tertiary hover:text-red"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      <Field label="Nama model" required>
        <TextInput
          value={name}
          disabled={uploading}
          placeholder="Mis. Deteksi kendaraan"
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Deskripsi">
        <TextArea
          rows={2}
          value={description}
          disabled={uploading}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field
        label="Kelas objek"
        hint="Pisahkan dengan koma. Kosongkan untuk dibaca otomatis dari file model."
      >
        <TextInput
          value={classes}
          disabled={uploading}
          placeholder="person, car, truck"
          onChange={(e) => setClasses(e.target.value)}
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="border border-red/40 bg-red/10 px-3 py-2 text-xs text-red"
        >
          {error}
        </p>
      )}

      {progress ? (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between font-mono text-[10px] text-txt-secondary">
            <span>Mengunggah {progress.percent}%</span>
            <span>
              {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
            </span>
          </div>
          <ProgressBar value={progress.percent} label="Progres unggah" />
          <Button
            variant="warning"
            size="sm"
            onClick={() => abortRef.current?.abort()}
          >
            Batalkan unggahan
          </Button>
        </div>
      ) : (
        <Button
          variant="primary"
          size="md"
          icon={Upload}
          disabled={!file}
          onClick={upload}
        >
          Unggah model
        </Button>
      )}

      <ol className="mt-auto flex list-decimal flex-col gap-1 border-t border-border-subtle pt-3 pl-4 text-[11px] leading-snug text-txt-tertiary">
        <li>Unggah file bobot beserta nama modelnya.</li>
        <li>Tekan Muat agar server inferensi memuat model ke GPU.</li>
        <li>Pilih model aktif pada stream di halaman Video.</li>
      </ol>
    </section>
  );
}
