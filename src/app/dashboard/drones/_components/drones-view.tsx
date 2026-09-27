"use client";

import { Navigation, Pencil, Plane, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DemoBadge } from "@/components/fleet/demo-badge";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TextInput } from "@/components/ui/input";
import { ViewLoading } from "@/components/ui/loading";
import { PageToolbar } from "@/components/ui/page-toolbar";
import {
  DRONE_STATUS_LABEL,
  DRONE_TYPE_LABEL,
  TELEMETRY_PROTOCOL_LABEL,
} from "@/constants/labels";
import { useFleet } from "@/hooks/use-fleet";
import { api, errorMessage } from "@/lib/api";
import { STATUS_TONE } from "@/lib/drone-status";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useDroneStore } from "@/stores/use-drone-store";
import { useStreamStore } from "@/stores/use-stream-store";
import type { Drone } from "@/types/drone";
import { DroneFormPanel } from "./drone-form-panel";

type Editing = { drone: Drone | null } | null;

/** Vehicle registry: list, add, edit, delete. */
export function DronesView() {
  const router = useRouter();
  const fleet = useFleet();
  const status = useDroneStore((s) => s.status);
  const loadError = useDroneStore((s) => s.error);
  const load = useDroneStore((s) => s.load);
  const upsert = useDroneStore((s) => s.upsert);
  const removeDrone = useDroneStore((s) => s.remove);
  const setActive = useDroneStore((s) => s.setActive);
  const invalidateStreams = useStreamStore((s) => s.invalidate);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Drone | null>(null);
  const [removing, setRemoving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fleet;
    return fleet.filter(({ drone }) =>
      [drone.callsign, drone.id, drone.model].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [fleet, query]);

  const existingIds = useMemo(() => fleet.map((f) => f.drone.id), [fleet]);

  const onSaved = (drone: Drone, created: boolean) => {
    upsert(drone);
    invalidateStreams();
    setEditing(null);
    toast.success(
      created
        ? `${drone.callsign} ditambahkan`
        : `${drone.callsign} diperbarui`,
    );
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.drones.remove(deleting.id);
      removeDrone(deleting.id);
      invalidateStreams();
      toast.success(`${deleting.callsign} dihapus`);
      if (editing?.drone?.id === deleting.id) setEditing(null);
      setDeleting(null);
    } catch (error) {
      toast.error("Gagal menghapus drone", errorMessage(error));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <PageToolbar title="Drone" meta={`${fleet.length} terdaftar`}>
          <div className="relative">
            <Search
              size={12}
              className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-txt-muted"
              aria-hidden
            />
            <TextInput
              aria-label="Cari drone"
              placeholder="Cari callsign, ID, model"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-7 w-56 pl-6"
            />
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setEditing({ drone: null })}
          >
            Tambah drone
          </Button>
        </PageToolbar>

        <div className="min-h-0 flex-1 overflow-auto">
          {status === "loading" && fleet.length === 0 ? (
            <ViewLoading label="Memuat daftar drone…" />
          ) : status === "error" && fleet.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Gagal memuat drone"
              description={loadError ?? undefined}
              action={
                <Button onClick={() => void load(true)}>Coba lagi</Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Plane}
              title={
                fleet.length === 0
                  ? "Belum ada drone"
                  : "Tidak ada drone yang cocok"
              }
              description={
                fleet.length === 0
                  ? "Daftarkan drone beserta alamat telemetri dan sumber videonya."
                  : undefined
              }
              action={
                fleet.length === 0 ? (
                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => setEditing({ drone: null })}
                  >
                    Tambah drone
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-gcs-primary">
                <tr className="border-b border-border-subtle">
                  {[
                    "Drone",
                    "ID",
                    "Tipe",
                    "Telemetri",
                    "Video",
                    "Status",
                    "Diubah",
                    "",
                  ].map((h) => (
                    <th
                      key={h || "actions"}
                      scope="col"
                      className="label px-3 py-2 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ drone, status: droneStatus }) => {
                  const tone = STATUS_TONE[droneStatus];
                  const selected = editing?.drone?.id === drone.id;
                  return (
                    <tr
                      key={drone.id}
                      className={cn(
                        "border-b border-border-subtle hover:bg-gcs-secondary/60",
                        selected && "bg-cyan/5",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-txt-primary">
                          {drone.callsign}
                          {drone.demo && <DemoBadge />}
                        </div>
                        <div className="text-[11px] text-txt-tertiary">
                          {drone.model}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-txt-secondary">
                        {drone.id}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-txt-secondary">
                        {DRONE_TYPE_LABEL[drone.type]}
                      </td>
                      <td className="max-w-64 px-3 py-2.5">
                        {drone.telemetry.enabled ? (
                          <>
                            <div className="text-[11px] text-txt-secondary">
                              {
                                TELEMETRY_PROTOCOL_LABEL[
                                  drone.telemetry.protocol
                                ]
                              }
                            </div>
                            <div
                              className="truncate font-mono text-[10px] text-txt-tertiary"
                              title={drone.telemetry.url}
                            >
                              {drone.telemetry.url}
                            </div>
                          </>
                        ) : (
                          <Badge>Nonaktif</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="font-mono text-[11px] text-txt-secondary"
                          title={drone.videoSources
                            .map((v) => v.name)
                            .join(", ")}
                        >
                          {drone.videoSources.length} sumber
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn("status-dot", tone.dot)}
                            aria-hidden
                          />
                          <span
                            className={cn(
                              "font-mono text-[10px] uppercase",
                              tone.text,
                            )}
                          >
                            {DRONE_STATUS_LABEL[droneStatus]}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-txt-tertiary">
                        {formatDateTime(drone.updatedAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          {drone.telemetry.enabled && (
                            <IconButton
                              size="xs"
                              variant="ghost"
                              icon={Navigation}
                              label={`Kendalikan ${drone.callsign}`}
                              onClick={() => {
                                setActive(drone.id);
                                router.push("/dashboard/fly");
                              }}
                            />
                          )}
                          <IconButton
                            size="xs"
                            variant="ghost"
                            icon={Pencil}
                            label={`Ubah ${drone.callsign}`}
                            onClick={() => setEditing({ drone })}
                          />
                          <IconButton
                            size="xs"
                            variant="ghost"
                            icon={Trash2}
                            label={`Hapus ${drone.callsign}`}
                            onClick={() => setDeleting(drone)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <DroneFormPanel
          key={editing.drone?.id ?? "new"}
          drone={editing.drone}
          existingIds={existingIds}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Hapus ${deleting.callsign}?` : ""}
        message="Drone, tautan telemetri dan sumber videonya akan dihapus dari registri. Target drop yang ditugaskan ke drone ini menjadi tanpa drone."
        confirmLabel="Hapus drone"
        loading={removing}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
