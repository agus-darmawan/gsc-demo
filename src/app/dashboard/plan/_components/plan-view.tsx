"use client";

import {
  Download,
  FilePlus2,
  Focus,
  FolderOpen,
  Grid3x3,
  MapPin,
  Play,
  Save,
  Trash2,
  Upload,
  Waypoints,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_WAYPOINT_ALT_M } from "@/constants/defaults";
import { MISSION_END_LABEL } from "@/constants/labels";
import { useActiveVehicle } from "@/hooks/use-fleet";
import { api, errorMessage } from "@/lib/api";
import { downloadText } from "@/lib/download";
import {
  createEmptyPlan,
  createWaypoint,
  generateSurvey,
  missionStats,
} from "@/lib/mission";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/use-app-store";
import { useDroneStore } from "@/stores/use-drone-store";
import { useMissionStore } from "@/stores/use-mission-store";
import type { LatLon } from "@/types/geo";
import type { MissionEndAction, MissionPlan } from "@/types/mission";
import { parsePlanFile, serializePlan } from "../_lib/plan-file";
import { LoadPlanDialog } from "./load-plan-dialog";
import { PlanStats } from "./plan-stats";
import { WaypointList } from "./waypoint-list";

type Tool = "none" | "waypoint" | "survey";

const END_OPTIONS = (Object.keys(MISSION_END_LABEL) as MissionEndAction[]).map(
  (value) => ({
    value,
    label: MISSION_END_LABEL[value],
  }),
);

const WP_LAYER = "plan-wp";

/** Waypoint mission planner (QGroundControl "Plan" view). */
export function PlanView() {
  const router = useRouter();
  const vehicle = useActiveVehicle();
  const drones = useDroneStore((s) => s.drones);
  const setActive = useDroneStore((s) => s.setActive);
  const hydrated = useAppStore((s) => s.hydrated);

  const drone = vehicle?.drone ?? null;
  const droneId = drone?.id ?? null;
  const t = vehicle?.telemetry ?? null;

  const plan = useMissionStore((s) =>
    droneId ? s.drafts[droneId] : undefined,
  );
  const uploaded = useMissionStore((s) =>
    droneId ? s.uploaded[droneId] : undefined,
  );
  const {
    setDraft,
    patchDraft,
    addWaypoints,
    updateWaypoint,
    removeWaypoint,
    moveWaypoint,
    markUploaded,
  } = useMissionStore.getState();

  const [initialView] = useState(() => initialMapView(null, 4_000));
  const [tool, setTool] = useState<Tool>("none");
  const [anchor, setAnchor] = useState<LatLon | null>(null);
  const [spacing, setSpacing] = useState("60");
  const [surveyAlt, setSurveyAlt] = useState("80");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitKey, setFitKey] = useState(0);
  const [busy, setBusy] = useState<"save" | "upload" | "start" | null>(null);
  const missionCapable = useDroneStore((s) => {
    const drone = s.drones.find((d) => d.id === droneId);
    if (!drone) return false;
    return (
      drone.demo ||
      (s.live[drone.id]?.capabilities.includes("mission") ?? false)
    );
  });
  const [loadOpen, setLoadOpen] = useState(false);
  const [confirm, setConfirm] = useState<"new" | "start" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flyable = useMemo(
    () => drones.filter((d) => d.telemetry.enabled),
    [drones],
  );

  useEffect(() => {
    if (hydrated && droneId && drone && !plan) {
      setDraft(droneId, createEmptyPlan(droneId, `Misi ${drone.callsign}`));
    }
  }, [hydrated, droneId, drone, plan, setDraft]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the editor whenever the active drone changes
  useEffect(() => {
    setTool("none");
    setAnchor(null);
    setSelectedId(null);
    setFitKey((k) => k + 1);
  }, [droneId]);

  const homeLat = t?.homeLat ?? null;
  const homeLon = t?.homeLon ?? null;
  const home = useMemo<LatLon | null>(
    () =>
      homeLat != null && homeLon != null
        ? { lat: homeLat, lon: homeLon }
        : null,
    [homeLat, homeLon],
  );
  const cruiseSpeedMs = drone?.params.cruiseSpeedMs ?? 12;

  const stats = useMemo(
    () => (plan ? missionStats(plan, home, cruiseSpeedMs) : null),
    [plan, home, cruiseSpeedMs],
  );

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = (plan?.waypoints ?? []).map((wp, i) => ({
      id: wp.id,
      lat: wp.lat,
      lon: wp.lon,
      kind: "waypoint",
      label: String(i + 1),
      selected: wp.id === selectedId,
      draggable: true,
    }));
    return list;
  }, [plan, selectedId]);

  const extras = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (home) list.push({ id: "home", ...home, kind: "home" });
    if (anchor) list.push({ id: "anchor", ...anchor, kind: "point" });
    return list;
  }, [home, anchor]);

  const route = useMemo<LatLon[]>(() => {
    const wps: LatLon[] = plan?.waypoints ?? [];
    if (wps.length === 0) return [];
    const start = home ? [home] : [];
    return [...start, ...wps, ...(plan?.endAction === "rtl" ? start : [])];
  }, [plan, home]);

  const fitTarget = useMemo(
    () => ({
      kind: "bounds" as const,
      points: route.length > 0 ? route : home ? [home] : [],
    }),
    [route, home],
  );

  if (!drone || !droneId) {
    return (
      <div className="grid-overlay flex flex-1 items-center justify-center">
        <EmptyState
          icon={Waypoints}
          title="Belum ada drone dengan telemetri"
          description="Tambahkan drone dengan tautan telemetri aktif untuk membuat rencana misi."
          action={
            <Button
              variant="primary"
              onClick={() => router.push("/dashboard/drones")}
            >
              Kelola drone
            </Button>
          }
        />
      </div>
    );
  }

  const onPick = (pick: MapPick) => {
    if (!plan) return;
    if (pick.kind === "entity") {
      if (pick.layer === WP_LAYER) setSelectedId(pick.id);
      return;
    }
    if (tool === "waypoint") {
      const last = plan.waypoints[plan.waypoints.length - 1];
      const wp = createWaypoint(
        pick.position,
        last?.altM ?? DEFAULT_WAYPOINT_ALT_M,
      );
      addWaypoints(droneId, [wp]);
      setSelectedId(wp.id);
      return;
    }
    if (tool === "survey") {
      if (!anchor) {
        setAnchor(pick.position);
        return;
      }
      const generated = generateSurvey(
        anchor,
        pick.position,
        Number(spacing) || 60,
        Number(surveyAlt) || 80,
      );
      if (generated.length > 0) {
        addWaypoints(droneId, generated);
        toast.success(`${generated.length} titik survei ditambahkan`);
      } else {
        toast.warning("Area survei terlalu kecil");
      }
      setAnchor(null);
      setTool("none");
      return;
    }
    setSelectedId(null);
  };

  const toggleTool = (next: Tool) => {
    setAnchor(null);
    setTool((current) => (current === next ? "none" : next));
  };

  const save = async () => {
    if (!plan) return;
    setBusy("save");
    try {
      const saved = await api.missions.save(plan);
      setDraft(droneId, saved);
      toast.success(`Rencana "${saved.name}" disimpan`);
    } catch (error) {
      toast.error("Gagal menyimpan rencana", errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const upload = async () => {
    if (!plan) return;
    setBusy("upload");
    try {
      const ack = await api.missions.upload(droneId, plan);
      if (ack.accepted) {
        markUploaded(droneId, plan);
        toast.success(ack.message);
      } else {
        toast.warning("Unggah misi ditolak", ack.message);
      }
    } catch (error) {
      toast.error("Gagal mengunggah misi", errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const start = async () => {
    setConfirm(null);
    setBusy("start");
    try {
      const ack = await api.vehicle.send(droneId, { type: "mission-start" });
      if (ack.accepted) {
        toast.success(ack.message);
        router.push("/dashboard/fly");
      } else {
        toast.warning("Misi tidak dapat dimulai", ack.message);
      }
    } catch (error) {
      toast.error("Perintah gagal", errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const importFile = async (file: File) => {
    const parsed = parsePlanFile(await file.text(), droneId);
    if (!parsed) {
      toast.error("File rencana tidak valid");
      return;
    }
    setDraft(droneId, parsed);
    setFitKey((k) => k + 1);
    toast.success(`Rencana "${parsed.name}" diimpor`);
  };

  const loadPlan = (loaded: MissionPlan) => {
    setDraft(droneId, { ...loaded, droneId });
    setSelectedId(null);
    setFitKey((k) => k + 1);
    toast.success(`Rencana "${loaded.name}" dimuat`);
  };

  const waypointCount = plan?.waypoints.length ?? 0;
  const uploadedCurrent =
    uploaded &&
    plan &&
    uploaded.planName === plan.name &&
    uploaded.waypointCount === waypointCount;

  return (
    <div className="flex min-w-0 flex-1">
      <aside className="flex w-[360px] shrink-0 flex-col border-r border-border-subtle bg-gcs-primary">
        <div className="flex flex-col gap-3 border-b border-border-subtle p-3">
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <Field label="Drone">
              <Select
                value={droneId}
                onChange={setActive}
                options={flyable.map((d) => ({
                  value: d.id,
                  label: `${d.callsign} (${d.model})`,
                }))}
              />
            </Field>
            <IconButton
              icon={FilePlus2}
              label="Rencana baru"
              onClick={() => setConfirm("new")}
            />
          </div>
          {plan && (
            <>
              <Field label="Nama rencana">
                <TextInput
                  value={plan.name}
                  onChange={(e) =>
                    patchDraft(droneId, { name: e.target.value })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Lepas landas (m)">
                  <TextInput
                    type="number"
                    min={5}
                    value={plan.takeoffAltM}
                    onChange={(e) =>
                      patchDraft(droneId, {
                        takeoffAltM: Math.max(5, Number(e.target.value) || 0),
                      })
                    }
                  />
                </Field>
                <Field label="Setelah titik akhir">
                  <Select
                    value={plan.endAction}
                    options={END_OPTIONS}
                    onChange={(endAction) => patchDraft(droneId, { endAction })}
                  />
                </Field>
              </div>
              <Switch
                checked={plan.repeat}
                onChange={(repeat) => patchDraft(droneId, { repeat })}
                label="Ulangi misi (patroli)"
                description="Kembali ke titik pertama setelah titik terakhir sampai dihentikan."
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-1 border-b border-border-subtle px-3 py-2">
          <Button
            size="xs"
            icon={MapPin}
            variant={tool === "waypoint" ? "primary" : "secondary"}
            aria-pressed={tool === "waypoint"}
            onClick={() => toggleTool("waypoint")}
          >
            Tambah titik
          </Button>
          <Button
            size="xs"
            icon={Grid3x3}
            variant={tool === "survey" ? "primary" : "secondary"}
            aria-pressed={tool === "survey"}
            onClick={() => toggleTool("survey")}
          >
            Pola survei
          </Button>
          <IconButton
            size="xs"
            icon={Focus}
            label="Pusatkan ke rencana"
            className="ml-auto"
            onClick={() => setFitKey((k) => k + 1)}
          />
          <IconButton
            size="xs"
            variant="danger"
            icon={Trash2}
            label="Hapus semua titik"
            disabled={waypointCount === 0}
            onClick={() =>
              plan && setDraft(droneId, { ...plan, waypoints: [] })
            }
          />
        </div>

        {tool !== "none" && (
          <div className="border-b border-border-subtle bg-violet/5 px-3 py-2 text-[11px] text-violet-light">
            {tool === "waypoint" &&
              "Klik peta untuk menambah titik. Seret titik untuk memindahkan."}
            {tool === "survey" && (
              <div className="flex flex-col gap-2">
                <span>
                  {anchor
                    ? "Klik sudut kedua area survei."
                    : "Klik sudut pertama area survei."}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="label">Jarak lintasan (m)</span>
                    <TextInput
                      type="number"
                      min={10}
                      value={spacing}
                      onChange={(e) => setSpacing(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="label">Ketinggian (m)</span>
                    <TextInput
                      type="number"
                      min={10}
                      value={surveyAlt}
                      onChange={(e) => setSurveyAlt(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {plan && waypointCount > 0 ? (
            <WaypointList
              waypoints={plan.waypoints}
              selectedId={selectedId}
              maxAltM={drone.params.maxAltM}
              onSelect={setSelectedId}
              onUpdate={(id, patch) => updateWaypoint(droneId, id, patch)}
              onMove={(id, dir) => moveWaypoint(droneId, id, dir)}
              onRemove={(id) => {
                removeWaypoint(droneId, id);
                setSelectedId(null);
              }}
            />
          ) : (
            <EmptyState
              icon={Waypoints}
              title="Rencana masih kosong"
              description="Pilih Tambah titik lalu klik peta, atau buat pola survei untuk memetakan area."
            />
          )}
        </div>

        {plan && stats && <PlanStats stats={stats} count={waypointCount} />}

        <div className="flex flex-col gap-2 border-t border-border-subtle p-3">
          <div className="flex gap-1">
            <Button
              size="xs"
              icon={Save}
              loading={busy === "save"}
              disabled={waypointCount === 0}
              onClick={save}
            >
              Simpan
            </Button>
            <Button
              size="xs"
              icon={FolderOpen}
              onClick={() => setLoadOpen(true)}
            >
              Muat
            </Button>
            <Button
              size="xs"
              icon={Download}
              disabled={!plan || waypointCount === 0}
              onClick={() =>
                plan &&
                downloadText(
                  `${plan.name.replace(/\s+/g, "-").toLowerCase()}.plan.json`,
                  serializePlan(plan),
                  "application/json",
                )
              }
            >
              Ekspor
            </Button>
            <Button
              size="xs"
              icon={Upload}
              variant="ghost"
              onClick={() => fileRef.current?.click()}
            >
              Impor
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFile(file);
                e.target.value = "";
              }}
            />
          </div>
          {droneId && !missionCapable && (
            <p className="border border-orange/40 bg-orange/10 p-2 text-[11px] leading-relaxed text-orange">
              Kendali misi untuk drone ini belum diizinkan. Aktifkan "Izinkan
              kendali dari GCS" di aplikasi bridge pada remote controller.
              Rencana tetap tersimpan dan tampil di peta.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              icon={Upload}
              loading={busy === "upload"}
              disabled={waypointCount === 0 || !missionCapable}
              onClick={upload}
            >
              Unggah ke drone
            </Button>
            <Button
              variant="success"
              icon={Play}
              loading={busy === "start"}
              disabled={!uploadedCurrent || !missionCapable}
              onClick={() => setConfirm("start")}
            >
              Mulai misi
            </Button>
          </div>
          <p
            className={cn(
              "text-[11px]",
              uploadedCurrent ? "text-green" : "text-txt-tertiary",
            )}
          >
            {uploadedCurrent
              ? `Misi sudah diunggah ke ${drone.callsign}.`
              : "Unggah rencana ke drone sebelum memulai misi."}
          </p>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        <MapCanvas
          initialView={initialView}
          onPick={onPick}
          pickMode={tool !== "none"}
        >
          <DroneLayer selectedId={droneId} />
          {route.length > 1 && (
            <PolylineLayer
              id="plan-route"
              points={route}
              color="#39d0d8"
              width={2.5}
            />
          )}
          <MarkerLayer
            layer={WP_LAYER}
            markers={markers}
            onDragEnd={(id, position) =>
              updateWaypoint(droneId, id, {
                lat: position.lat,
                lon: position.lon,
              })
            }
          />
          <MarkerLayer layer="plan-extra" markers={extras} />
          <MapCamera target={fitTarget} trigger={fitKey} />
          <CursorReadout className="absolute bottom-11 left-2 z-10" />
        </MapCanvas>
        <LayerSwitcher className="absolute bottom-2 left-2 z-10" />
      </div>

      <LoadPlanDialog
        open={loadOpen}
        droneId={droneId}
        onClose={() => setLoadOpen(false)}
        onLoad={loadPlan}
      />
      <ConfirmDialog
        open={confirm === "new"}
        title="Buat rencana baru?"
        message="Titik pada rencana yang sedang diedit akan dihapus. Simpan dulu jika masih diperlukan."
        confirmLabel="Buat baru"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setDraft(droneId, createEmptyPlan(droneId, `Misi ${drone.callsign}`));
          setSelectedId(null);
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "start"}
        tone="warning"
        title={`Mulai misi ${drone.callsign}?`}
        message={
          vehicle?.status === "landed"
            ? `${drone.callsign} akan lepas landas ke ${plan?.takeoffAltM ?? 30} m lalu terbang ke ${waypointCount} titik.`
            : `${drone.callsign} akan langsung terbang ke titik misi.`
        }
        confirmLabel="Mulai misi"
        onCancel={() => setConfirm(null)}
        onConfirm={start}
      />
    </div>
  );
}
