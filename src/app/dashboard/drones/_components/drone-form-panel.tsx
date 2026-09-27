"use client";

import { Save, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TextArea, TextInput } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { DRONE_TYPE_LABEL } from "@/constants/labels";
import { api, errorMessage } from "@/lib/api";
import type { Drone, DroneType } from "@/types/drone";
import {
  type DroneFormErrors,
  type DroneFormValues,
  droneToForm,
  emptyDroneForm,
  formToInput,
  validateDroneForm,
} from "../_lib/drone-form";
import { FormSection } from "./section";
import { TelemetryLinkFields } from "./telemetry-link-fields";
import { VideoSourceFields } from "./video-source-fields";

const TYPES = (Object.keys(DRONE_TYPE_LABEL) as DroneType[]).map((value) => ({
  value,
  label: DRONE_TYPE_LABEL[value],
}));

interface DroneFormPanelProps {
  drone: Drone | null;
  existingIds: readonly string[];
  onClose: () => void;
  onSaved: (drone: Drone, created: boolean) => void;
}

/** Create / edit a vehicle: identity, telemetry link, video feeds, limits. */
export function DroneFormPanel({
  drone,
  existingIds,
  onClose,
  onSaved,
}: DroneFormPanelProps) {
  const isNew = drone === null;
  const [values, setValues] = useState<DroneFormValues>(() =>
    drone ? droneToForm(drone) : emptyDroneForm(),
  );
  const [errors, setErrors] = useState<DroneFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const formId = useId();

  const patch = (next: Partial<DroneFormValues>) =>
    setValues((v) => ({ ...v, ...next }));

  const submit = async () => {
    const validation = validateDroneForm(values, { isNew, existingIds });
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setSaving(true);
    setServerError(null);
    try {
      const input = formToInput(values);
      const saved = isNew
        ? await api.drones.create(input)
        : await api.drones.update(input.id, input);
      onSaved(saved, isNew);
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.keys(errors).length;

  return (
    <aside
      aria-labelledby={formId}
      className="flex w-[480px] shrink-0 flex-col border-l border-border-subtle bg-gcs-primary motion-safe:animate-slide-in"
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-4">
        <h2 id={formId} className="text-sm font-semibold">
          {isNew ? "Tambah drone" : `Ubah ${drone.callsign}`}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup formulir"
          className="ml-auto text-txt-tertiary hover:text-txt-primary"
        >
          <X size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <FormSection title="Identitas">
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="ID drone"
              required
              error={errors.id}
              hint={
                isNew
                  ? "Dipakai sebagai kunci di backend, tidak bisa diubah."
                  : "ID tidak bisa diubah."
              }
            >
              <TextInput
                value={values.id}
                disabled={!isNew}
                invalid={!!errors.id}
                placeholder="evo2-v3-003"
                spellCheck={false}
                onChange={(e) => patch({ id: e.target.value.toLowerCase() })}
              />
            </Field>
            <Field label="Callsign" required error={errors.callsign}>
              <TextInput
                value={values.callsign}
                invalid={!!errors.callsign}
                placeholder="GARUDA-6"
                onChange={(e) =>
                  patch({ callsign: e.target.value.toUpperCase() })
                }
              />
            </Field>
          </div>
          <Field label="Model / pabrikan" required error={errors.model}>
            <TextInput
              value={values.model}
              invalid={!!errors.model}
              placeholder="Autel EVO II Pro V3"
              onChange={(e) => patch({ model: e.target.value })}
            />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="label">Tipe wahana</span>
            <Segmented
              ariaLabel="Tipe wahana"
              value={values.type}
              options={TYPES}
              onChange={(type) => patch({ type })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nomor seri">
              <TextInput
                value={values.serialNumber}
                onChange={(e) => patch({ serialNumber: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Catatan">
            <TextArea
              rows={2}
              value={values.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </Field>
        </FormSection>

        <FormSection
          title="Jenis wahana"
          description="Drone demo disimulasikan di server untuk fitur demo (drop payload, eksekusi misi) dan tampil berwarna ungu."
        >
          <Switch
            checked={values.demo}
            onChange={(demo) => patch({ demo })}
            label="Drone demo (simulasi)"
            description="Jangan aktifkan untuk drone fisik."
          />
        </FormSection>

        {!values.demo && (
          <TelemetryLinkFields
            values={values}
            errors={errors}
            onChange={patch}
          />
        )}
        <VideoSourceFields
          sources={values.videoSources}
          errors={errors}
          onChange={(videoSources) => patch({ videoSources })}
        />

        <FormSection
          title="Parameter penerbangan"
          description="Dipakai oleh failsafe dan perencana misi."
        >
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ketinggian RTL (m)" error={errors.rtlAltM}>
              <TextInput
                type="number"
                value={values.rtlAltM}
                invalid={!!errors.rtlAltM}
                onChange={(e) => patch({ rtlAltM: e.target.value })}
              />
            </Field>
            <Field label="Ketinggian maks. (m)" error={errors.maxAltM}>
              <TextInput
                type="number"
                value={values.maxAltM}
                invalid={!!errors.maxAltM}
                onChange={(e) => patch({ maxAltM: e.target.value })}
              />
            </Field>
            <Field label="Kecepatan jelajah (m/s)" error={errors.cruiseSpeedMs}>
              <TextInput
                type="number"
                value={values.cruiseSpeedMs}
                invalid={!!errors.cruiseSpeedMs}
                onChange={(e) => patch({ cruiseSpeedMs: e.target.value })}
              />
            </Field>
            <Field label="Baterai rendah (%)" error={errors.lowBatteryPct}>
              <TextInput
                type="number"
                value={values.lowBatteryPct}
                invalid={!!errors.lowBatteryPct}
                onChange={(e) => patch({ lowBatteryPct: e.target.value })}
              />
            </Field>
          </div>
        </FormSection>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border-subtle px-4 py-3">
        {(serverError || errors.capabilities || errorCount > 0) && (
          <p role="alert" className="text-[11px] text-red">
            {serverError ??
              errors.capabilities ??
              `Periksa ${errorCount} isian yang belum valid.`}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={saving}
            onClick={submit}
          >
            {isNew ? "Simpan drone" : "Simpan perubahan"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
