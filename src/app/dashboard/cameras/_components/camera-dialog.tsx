"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { TextArea, TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { VIDEO_PROTOCOL_LABEL } from "@/constants/labels";
import { api, errorMessage } from "@/lib/api";
import { DRONE_ID_PATTERN, isValidVideoUrl } from "@/lib/validators";
import type { Camera, CameraInput } from "@/types/camera";
import type { VideoProtocol } from "@/types/drone";

const PROTOCOLS = Object.entries(VIDEO_PROTOCOL_LABEL).map(
  ([value, label]) => ({
    value: value as VideoProtocol,
    label,
  }),
);

function parseCoord(
  text: string,
  min: number,
  max: number,
): number | null | "invalid" {
  if (!text.trim()) return null;
  const n = Number(text.trim().replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? n : "invalid";
}

/** Create / edit a fixed camera (CCTV, phone streaming RTMP, IP camera). */
export function CameraDialog({
  camera,
  existingIds,
  onSaved,
  onClose,
}: {
  camera: Camera | null;
  existingIds: readonly string[];
  onSaved: (camera: Camera) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState(camera?.id ?? "");
  const [name, setName] = useState(camera?.name ?? "");
  const [protocol, setProtocol] = useState<VideoProtocol>(
    camera?.protocol ?? "rtmp",
  );
  const [url, setUrl] = useState(camera?.url ?? "");
  const [lat, setLat] = useState(camera?.lat != null ? String(camera.lat) : "");
  const [lon, setLon] = useState(camera?.lon != null ? String(camera.lon) : "");
  const [notes, setNotes] = useState(camera?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: Record<string, string> = {};
    if (!camera) {
      if (!DRONE_ID_PATTERN.test(id))
        next.id = "3–40 karakter: huruf kecil, angka, - atau _";
      else if (existingIds.includes(id)) next.id = "ID sudah dipakai";
    }
    if (!name.trim()) next.name = "Nama wajib diisi";
    if (!isValidVideoUrl(protocol, url))
      next.url = "URL tidak sesuai dengan protokol";
    const latValue = parseCoord(lat, -90, 90);
    const lonValue = parseCoord(lon, -180, 180);
    if (latValue === "invalid") next.lat = "−90 s/d 90";
    if (lonValue === "invalid") next.lon = "−180 s/d 180";
    if ((latValue === null) !== (lonValue === null))
      next.lon = "Isi lintang dan bujur sekaligus";
    setErrors(next);
    if (
      Object.keys(next).length > 0 ||
      latValue === "invalid" ||
      lonValue === "invalid"
    )
      return;

    const input: CameraInput = {
      id: camera?.id ?? id.trim(),
      name: name.trim(),
      protocol,
      url: url.trim(),
      lat: latValue,
      lon: lonValue,
      notes: notes.trim() || null,
    };
    setSaving(true);
    try {
      onSaved(
        camera
          ? await api.cameras.update(camera.id, input)
          : await api.cameras.create(input),
      );
    } catch (error) {
      setErrors({ form: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={camera ? `Ubah ${camera.name}` : "Tambah kamera"}
      description="Kamera tetap, misalnya CCTV atau ponsel yang mengirim RTMP ke server."
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
        {!camera && (
          <Field label="ID kamera" required error={errors.id}>
            <TextInput
              value={id}
              invalid={!!errors.id}
              placeholder="cctv-gerbang"
              onChange={(e) => setId(e.target.value.toLowerCase())}
            />
          </Field>
        )}
        <Field label="Nama" required error={errors.name}>
          <TextInput
            value={name}
            invalid={!!errors.name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <Field label="Protokol">
            <Select
              value={protocol}
              options={PROTOCOLS}
              onChange={setProtocol}
            />
          </Field>
          <Field
            label="URL stream"
            required
            error={errors.url}
            hint="RTMP: ponsel mengirim ke rtmp://<server>/live/<nama>. RTSP/HLS: ditarik oleh server."
          >
            <TextInput
              value={url}
              invalid={!!errors.url}
              placeholder="rtmp://192.168.1.10/live/cctv1"
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Lintang (opsional)" error={errors.lat}>
            <TextInput
              value={lat}
              invalid={!!errors.lat}
              inputMode="decimal"
              placeholder="-6.2079"
              onChange={(e) => setLat(e.target.value)}
            />
          </Field>
          <Field label="Bujur (opsional)" error={errors.lon}>
            <TextInput
              value={lon}
              invalid={!!errors.lon}
              inputMode="decimal"
              placeholder="106.8439"
              onChange={(e) => setLon(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Catatan">
          <TextArea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        {errors.form && (
          <p role="alert" className="text-xs text-red">
            {errors.form}
          </p>
        )}
      </div>
    </Dialog>
  );
}
