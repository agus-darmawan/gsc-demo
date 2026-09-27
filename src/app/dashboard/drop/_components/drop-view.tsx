"use client";

import { Plus, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type CameraTarget,
  CursorReadout,
  DroneLayer,
  initialMapView,
  LayerSwitcher,
  MapCamera,
  MapCanvas,
  type MapMarker,
  type MapPick,
  MarkerLayer,
  PolylineLayer,
} from "@/components/map";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { TextArea, TextInput } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { DROP_DEMO_NOTICE } from "@/constants/demo";
import { DRONE_STATUS_LABEL, DROP_AFTER_LABEL } from "@/constants/labels";
import { type FleetEntry, useFleet } from "@/hooks/use-fleet";
import { api, errorMessage } from "@/lib/api";
import { formatDistance, formatDuration } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDroneStore } from "@/stores/use-drone-store";
import { useDropStore } from "@/stores/use-drop-store";
import type { DropAfterAction, DropTarget } from "@/types/drop";
import type { LatLon } from "@/types/geo";
import {
  approachEstimate,
  DROP_COLOR,
  type DropFormErrors,
  type DropFormValues,
  emptyDropForm,
  formFromTarget,
  formPosition,
  inputOf,
  toDropInput,
  validateDropForm,
  withPosition,
} from "../_lib/drop-form";
import { CoordinateInput } from "./coordinate-input";
import { DropList } from "./drop-list";

const TARGET_LAYER = "drop";
const LINE_STATUSES = new Set(["draft", "queued", "enroute", "stabilizing"]);

const AFTER_OPTIONS = (Object.keys(DROP_AFTER_LABEL) as DropAfterAction[]).map(
  (value) => ({
    value,
    label: DROP_AFTER_LABEL[value],
  }),
);

const positionOf = (entry: FleetEntry | undefined): LatLon | null => {
  const t = entry?.telemetry;
  return t?.lat != null && t.lon != null ? { lat: t.lat, lon: t.lon } : null;
};

type Pending = { kind: "execute" | "delete"; target: DropTarget };

/** Payload drop targets: assign a drone, pick coordinates, execute (demo). */
export function DropView() {
  const fleet = useFleet();
  const targets = useDropStore((s) => s.targets);
  const load = useDropStore((s) => s.load);
  const upsert = useDropStore((s) => s.upsert);
  const removeTarget = useDropStore((s) => s.remove);
  const activeId = useDroneStore((s) => s.activeId);
  const setActive = useDroneStore((s) => s.setActive);

  const [initialView] = useState(() => initialMapView(null, 6_000));
  const [form, setForm] = useState<DropFormValues>(() =>
    emptyDropForm(activeId ?? ""),
  );
  const [errors, setErrors] = useState<DropFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [camera, setCamera] = useState<{
    key: number;
    target: CameraTarget;
  } | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const flyable = useMemo(
    () => fleet.filter((f) => f.drone.telemetry.enabled),
    [fleet],
  );
  const firstFlyable = flyable[0]?.drone.id ?? "";

  useEffect(() => {
    if (!form.droneId && firstFlyable)
      setForm((f) => ({ ...f, droneId: firstFlyable }));
  }, [form.droneId, firstFlyable]);

  const formEntry = flyable.find((f) => f.drone.id === form.droneId);
  const formPos = formPosition(form);
  const formEstimate = formPos
    ? approachEstimate(
        positionOf(formEntry),
        formPos,
        Number(form.approachSpeedMs) || 8,
        Number(form.dropAltM) || 30,
        formEntry?.status === "landed",
      )
    : null;

  const focusOn = (target: CameraTarget) =>
    setCamera((c) => ({ key: (c?.key ?? 0) + 1, target }));

  const targetMarkers = useMemo<MapMarker[]>(
    () =>
      targets.map((t) => ({
        id: t.id,
        lat: t.lat,
        lon: t.lon,
        kind: "target",
        label: t.code,
        color: DROP_COLOR[t.status],
        selected: t.id === selectedId || t.id === editingId,
        draggable: t.status === "draft" && !picking,
      })),
    [targets, selectedId, editingId, picking],
  );

  const previewLat = formPos?.lat ?? null;
  const previewLon = formPos?.lon ?? null;
  const previewMarkers = useMemo<MapMarker[]>(
    () =>
      previewLat !== null && previewLon !== null
        ? [
            {
              id: "preview",
              lat: previewLat,
              lon: previewLon,
              kind: "point",
              color: "#a371f7",
            },
          ]
        : [],
    [previewLat, previewLon],
  );

  const lines = useMemo(() => {
    const result: {
      id: string;
      points: LatLon[];
      color: string;
      dashed: boolean;
    }[] = [];
    for (const t of targets) {
      if (!LINE_STATUSES.has(t.status)) continue;
      const from = positionOf(fleet.find((f) => f.drone.id === t.droneId));
      if (!from) continue;
      result.push({
        id: `drop-${t.id}`,
        points: [from, t],
        color: DROP_COLOR[t.status],
        dashed: t.status === "draft",
      });
    }
    return result;
  }, [targets, fleet]);

  const formFrom = positionOf(formEntry);
  const formLine =
    formPos && formFrom && !editingId ? [formFrom, formPos] : null;

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setPicking(false);
    setForm(emptyDropForm(form.droneId || firstFlyable));
  };

  const edit = (target: DropTarget) => {
    setEditingId(target.id);
    setSelectedId(target.id);
    setErrors({});
    setForm(formFromTarget(target));
    focusOn({
      kind: "point",
      lat: target.lat,
      lon: target.lon,
      heightM: 3_000,
    });
  };

  const onPick = (pick: MapPick) => {
    if (picking && pick.kind === "ground") {
      setForm((f) => withPosition(f, pick.position));
      setErrors((e) => ({ ...e, position: undefined }));
      setPicking(false);
      return;
    }
    if (pick.kind === "entity" && pick.layer === TARGET_LAYER) {
      const target = targets.find((t) => t.id === pick.id);
      if (!target) return;
      if (target.status === "draft") edit(target);
      else setSelectedId(target.id);
    }
  };

  const onTargetDragEnd = async (id: string, position: LatLon) => {
    const target = targets.find((t) => t.id === id);
    if (!target) return;
    try {
      const updated = await api.drops.update(id, {
        ...inputOf(target),
        ...position,
      });
      upsert(updated);
      if (editingId === id) setForm((f) => withPosition(f, position));
      toast.success(`Posisi ${updated.code} diperbarui`);
    } catch (error) {
      upsert({ ...target });
      toast.error(`Gagal memindahkan ${target.code}`, errorMessage(error));
    }
  };

  const submit = async () => {
    const maxAlt = formEntry?.drone.params.maxAltM ?? null;
    const validation = validateDropForm(form, maxAlt);
    setErrors(validation);
    const position = formPosition(form);
    if (Object.keys(validation).length > 0 || !position) return;

    setSaving(true);
    try {
      const input = toDropInput(form, position);
      const saved = editingId
        ? await api.drops.update(editingId, input)
        : await api.drops.create(input);
      upsert(saved);
      setSelectedId(saved.id);
      toast.success(
        editingId ? `${saved.code} diperbarui` : `${saved.code} ditambahkan`,
      );
      resetForm();
    } catch (error) {
      toast.error("Gagal menyimpan target", errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const run = async (
    target: DropTarget,
    action: "execute" | "cancel" | "delete",
  ) => {
    setBusyId(target.id);
    try {
      if (action === "delete") {
        await api.drops.remove(target.id);
        removeTarget(target.id);
        if (editingId === target.id) resetForm();
        toast.success(`${target.code} dihapus`);
      } else if (action === "cancel") {
        upsert(await api.drops.cancel(target.id));
        toast.warning(`${target.code} dibatalkan`);
      } else {
        const updated = await api.drops.execute(target.id);
        upsert(updated);
        if (updated.droneId) setActive(updated.droneId);
        toast.success(
          `${updated.code} dijalankan`,
          "Pantau progres di peta atau di tampilan Terbang.",
        );
      }
    } catch (error) {
      toast.error(`Tindakan pada ${target.code} gagal`, errorMessage(error));
      void load(true);
    } finally {
      setBusyId(null);
    }
  };

  const pendingEntry = pending
    ? fleet.find((f) => f.drone.id === pending.target.droneId)
    : undefined;
  const pendingEstimate = pending
    ? approachEstimate(
        positionOf(pendingEntry),
        pending.target,
        pending.target.approachSpeedMs,
        pending.target.dropAltM,
        pendingEntry?.status === "landed",
      )
    : null;

  return (
    <div className="flex min-w-0 flex-1">
      <aside className="flex w-[380px] shrink-0 flex-col border-r border-border-subtle bg-gcs-primary">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
          <h1 className="text-sm font-semibold">
            {editingId ? "Ubah titik drop" : "Titik drop baru"}
          </h1>
          <span className="font-mono text-[10px] text-txt-tertiary">
            {targets.length} target
          </span>
          {editingId && (
            <Button
              size="xs"
              variant="ghost"
              icon={X}
              className="ml-auto"
              onClick={resetForm}
            >
              Batal ubah
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 border-b border-border-subtle p-3">
            <Field label="Drone pelaksana" required error={errors.droneId}>
              <Select
                value={form.droneId}
                invalid={!!errors.droneId}
                onChange={(droneId) => setForm((f) => ({ ...f, droneId }))}
                options={[
                  { value: "", label: "Pilih drone", disabled: true },
                  ...flyable.map((f) => ({
                    value: f.drone.id,
                    label: `${f.drone.callsign} (${DRONE_STATUS_LABEL[f.status].toLowerCase()})`,
                    disabled: f.status === "lost" || f.status === "offline",
                  })),
                ]}
              />
            </Field>

            <CoordinateInput
              values={form}
              error={errors.position}
              picking={picking}
              onChange={(values) => {
                setForm(values);
                if (errors.position)
                  setErrors((e) => ({ ...e, position: undefined }));
              }}
              onTogglePick={() => setPicking((p) => !p)}
            />

            <div className="grid grid-cols-2 gap-2">
              <Field label="Ketinggian drop (m)" error={errors.dropAltM}>
                <TextInput
                  type="number"
                  min={5}
                  value={form.dropAltM}
                  invalid={!!errors.dropAltM}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dropAltM: e.target.value }))
                  }
                />
              </Field>
              <Field
                label="Kec. pendekatan (m/s)"
                error={errors.approachSpeedMs}
              >
                <TextInput
                  type="number"
                  min={1}
                  max={25}
                  value={form.approachSpeedMs}
                  invalid={!!errors.approachSpeedMs}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, approachSpeedMs: e.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="flex flex-col gap-1">
              <span className="label">Setelah payload dilepas</span>
              <Segmented
                ariaLabel="Aksi setelah drop"
                value={form.afterAction}
                options={AFTER_OPTIONS}
                onChange={(afterAction) =>
                  setForm((f) => ({ ...f, afterAction }))
                }
              />
            </div>

            <Field label="Catatan">
              <TextArea
                rows={2}
                placeholder="Mis. logistik medis, 2 kg"
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </Field>

            {formEstimate && (
              <p className="font-mono text-[10px] text-txt-tertiary">
                Jarak dari {formEntry?.drone.callsign}:{" "}
                {formatDistance(formEstimate.distanceM)}, perkiraan tiba{" "}
                {formatDuration(formEstimate.etaS)}
              </p>
            )}

            <Button
              variant="primary"
              size="md"
              icon={editingId ? Save : Plus}
              loading={saving}
              onClick={submit}
            >
              {editingId ? "Simpan perubahan" : "Tambah titik drop"}
            </Button>
          </div>

          <p className="mx-3 mb-2 border border-violet/40 bg-violet/10 p-2 text-[11px] leading-relaxed text-violet-light">
            {DROP_DEMO_NOTICE}
          </p>
          <DropList
            targets={targets}
            fleet={fleet}
            selectedId={selectedId}
            busyId={busyId}
            onSelect={(t) => {
              setSelectedId(t.id);
              focusOn({
                kind: "point",
                lat: t.lat,
                lon: t.lon,
                heightM: 3_000,
              });
            }}
            onEdit={edit}
            onExecute={(target) => {
              const drone = fleet.find(
                (f) => f.drone.id === target.droneId,
              )?.drone;
              if (drone && !drone.demo) {
                toast.warning(
                  "Eksekusi hanya untuk drone demo",
                  DROP_DEMO_NOTICE,
                );
                return;
              }
              setPending({ kind: "execute", target });
            }}
            onCancel={(target) => void run(target, "cancel")}
            onDelete={(target) => setPending({ kind: "delete", target })}
          />
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        <MapCanvas initialView={initialView} onPick={onPick} pickMode={picking}>
          <DroneLayer selectedId={form.droneId || null} />
          {lines.map((line) => (
            <PolylineLayer
              key={line.id}
              id={line.id}
              points={line.points}
              color={line.color}
              dashed={line.dashed}
            />
          ))}
          {formLine && (
            <PolylineLayer
              id="drop-form-line"
              points={formLine}
              color="#a371f7"
              dashed
            />
          )}
          <MarkerLayer
            layer={TARGET_LAYER}
            markers={targetMarkers}
            onDragEnd={onTargetDragEnd}
          />
          <MarkerLayer layer="drop-preview" markers={previewMarkers} />
          {camera && <MapCamera target={camera.target} trigger={camera.key} />}
          <CursorReadout className="absolute bottom-11 left-2 z-10" />
        </MapCanvas>
        <LayerSwitcher className="absolute bottom-2 left-2 z-10" />
        {picking && (
          <div className="hud-panel absolute top-3 left-1/2 z-20 -translate-x-1/2 px-3 py-2 text-xs text-violet-light">
            Klik lokasi target di peta. Tekan tombol lagi untuk batal.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pending?.kind === "execute"}
        tone="warning"
        title={pending ? `Jalankan ${pending.target.code}?` : ""}
        message={
          pending
            ? `${pendingEntry?.drone.callsign ?? "Drone"} akan ${pendingEntry?.status === "landed" ? "lepas landas lalu " : ""}terbang${
                pendingEstimate
                  ? ` ${formatDistance(pendingEstimate.distanceM)}`
                  : ""
              } ke target pada ${pending.target.dropAltM} m, melepas payload, lalu ${DROP_AFTER_LABEL[pending.target.afterAction].toLowerCase()}.`
            : ""
        }
        confirmLabel="Jalankan drop"
        loading={pending ? busyId === pending.target.id : false}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const target = pending.target;
          setPending(null);
          void run(target, "execute");
        }}
      />
      <ConfirmDialog
        open={pending?.kind === "delete"}
        title={pending ? `Hapus ${pending.target.code}?` : ""}
        message="Target akan dihapus permanen dari daftar."
        confirmLabel="Hapus"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const target = pending.target;
          setPending(null);
          void run(target, "delete");
        }}
      />
    </div>
  );
}
