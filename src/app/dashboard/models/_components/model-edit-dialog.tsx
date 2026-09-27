"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { TextArea, TextInput } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/stores/use-model-store";
import type { DetectionModel } from "@/types/model";
import { parseClasses } from "../_lib/model-file";

/** Name, classes and runtime detection parameters (applied without reloading). */
export function ModelEditDialog({
  model,
  onClose,
}: {
  model: DetectionModel;
  onClose: () => void;
}) {
  const upsert = useModelStore((s) => s.upsert);
  const [name, setName] = useState(model.name);
  const [description, setDescription] = useState(model.description ?? "");
  const [classes, setClasses] = useState(model.classes.join(", "));
  const [confidence, setConfidence] = useState(model.confidence);
  const [everyN, setEveryN] = useState(String(model.everyN));
  const [filter, setFilter] = useState<string[]>(model.classFilter);
  const [color, setColor] = useState(model.color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classList = parseClasses(classes);
  const toggleClass = (label: string) =>
    setFilter((f) =>
      f.includes(label) ? f.filter((x) => x !== label) : [...f, label],
    );

  const save = async () => {
    const n = Number(everyN);
    if (!name.trim()) {
      setError("Nama model wajib diisi.");
      return;
    }
    if (!Number.isInteger(n) || n < 1 || n > 30) {
      setError("Interval frame harus bilangan bulat 1–30.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api.models.update(model.id, {
        name: name.trim(),
        description: description.trim() || null,
        classes: classList,
        confidence,
        everyN: n,
        classFilter: filter.filter((c) => classList.includes(c)),
        color,
      });
      upsert(updated);
      toast.success(`Model "${updated.name}" diperbarui`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Ubah model"
      description={`${model.fileName} · kunci hitungan "${model.key}"`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" loading={saving} onClick={save}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Nama model" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Deskripsi">
          <TextArea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Kelas objek" hint="Pisahkan dengan koma.">
          <TextInput
            value={classes}
            onChange={(e) => setClasses(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-[1fr_96px_72px] gap-2">
          <Field
            label={`Ambang keyakinan: ${confidence.toFixed(2)}`}
            hint="Deteksi di bawah nilai ini diabaikan."
          >
            <input
              type="range"
              min={0.05}
              max={0.95}
              step={0.05}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-cyan"
            />
          </Field>
          <Field label="Tiap N frame" hint="1 = setiap frame">
            <TextInput
              inputMode="numeric"
              value={everyN}
              onChange={(e) => setEveryN(e.target.value)}
            />
          </Field>
          <Field label="Warna kotak">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-full cursor-pointer border border-border-default bg-gcs-overlay"
            />
          </Field>
        </div>

        {classList.length > 0 && (
          <Field
            label="Filter kelas"
            hint="Pilih kelas yang ditampilkan dan dihitung. Kosong = semua kelas."
          >
            <div className="flex flex-wrap gap-1">
              {classList.map((label) => {
                const on = filter.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleClass(label)}
                    className={cn(
                      "border px-1.5 py-0.5 font-mono text-[10px]",
                      on
                        ? "border-cyan/60 bg-cyan/10 text-cyan"
                        : "border-border-subtle text-txt-tertiary hover:text-txt-primary",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        {error && (
          <p role="alert" className="text-xs text-red">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
