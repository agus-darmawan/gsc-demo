"use client";

import { Cctv, MapPin, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ViewLoading } from "@/components/ui/loading";
import { PageToolbar } from "@/components/ui/page-toolbar";
import { VIDEO_PROTOCOL_LABEL } from "@/constants/labels";
import { api, errorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useCameraStore } from "@/stores/use-camera-store";
import { useStreamStore } from "@/stores/use-stream-store";
import type { Camera } from "@/types/camera";
import { CameraDialog } from "./camera-dialog";

type Editing = { camera: Camera | null } | null;

export function CamerasView() {
  const { cameras, status, error, load, upsert, remove } = useCameraStore();
  const streams = useStreamStore((s) => s.streams);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Camera | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const online = (id: string) =>
    streams.find((s) => s.cameraId === id)?.online ?? false;

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.cameras.remove(deleting.id);
      remove(deleting.id);
      toast.success(`${deleting.name} dihapus`);
      setDeleting(null);
    } catch (err) {
      toast.error("Gagal menghapus kamera", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <PageToolbar title="Kamera" meta={`${cameras.length} kamera tetap`}>
        <IconButton
          icon={RefreshCw}
          label="Muat ulang"
          variant="ghost"
          onClick={() => void load(true)}
        />
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setEditing({ camera: null })}
        >
          Tambah kamera
        </Button>
      </PageToolbar>

      <div className="min-h-0 flex-1 overflow-auto">
        {status === "loading" && cameras.length === 0 ? (
          <ViewLoading label="Memuat kamera…" />
        ) : cameras.length === 0 ? (
          <EmptyState
            icon={Cctv}
            title={
              status === "error" ? "Gagal memuat kamera" : "Belum ada kamera"
            }
            description={
              error ??
              "Tambahkan CCTV atau ponsel yang mengirim video RTMP ke server. Streamnya tampil di halaman Video dan bisa diberi model deteksi."
            }
          />
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gcs-primary text-[10px] uppercase tracking-wider text-txt-muted">
              <tr className="border-b border-border-subtle">
                <th className="px-3 py-2 font-medium">Kamera</th>
                <th className="px-3 py-2 font-medium">Sumber</th>
                <th className="px-3 py-2 font-medium">Lokasi</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="w-24 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {cameras.map((camera) => (
                <tr
                  key={camera.id}
                  className="border-b border-border-subtle align-top hover:bg-gcs-secondary/60"
                >
                  <td className="px-3 py-2.5">
                    <div className="text-xs text-txt-primary">
                      {camera.name}
                    </div>
                    <div className="font-mono text-[10px] text-txt-muted">
                      {camera.id}
                    </div>
                  </td>
                  <td className="max-w-80 px-3 py-2.5">
                    <div className="text-[11px] text-txt-secondary">
                      {VIDEO_PROTOCOL_LABEL[camera.protocol]}
                    </div>
                    <div
                      className="truncate font-mono text-[10px] text-txt-muted"
                      title={camera.url}
                    >
                      {camera.url}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-txt-secondary">
                    {camera.lat != null && camera.lon != null ? (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-cyan" aria-hidden />
                        {camera.lat.toFixed(5)}, {camera.lon.toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-txt-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        online(camera.id)
                          ? "text-[11px] text-green"
                          : "text-[11px] text-txt-muted"
                      }
                    >
                      {online(camera.id) ? "Siaran aktif" : "Tidak ada siaran"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        icon={Pencil}
                        label={`Ubah ${camera.name}`}
                        variant="ghost"
                        onClick={() => setEditing({ camera })}
                      />
                      <IconButton
                        icon={Trash2}
                        label={`Hapus ${camera.name}`}
                        variant="ghost"
                        onClick={() => setDeleting(camera)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <CameraDialog
          camera={editing.camera}
          existingIds={cameras.map((c) => c.id)}
          onClose={() => setEditing(null)}
          onSaved={(camera) => {
            upsert(camera);
            toast.success(
              editing.camera
                ? `${camera.name} diperbarui`
                : `${camera.name} ditambahkan`,
            );
            setEditing(null);
            void useStreamStore.getState().load(true);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Hapus ${deleting.name}?` : ""}
        message="Stream kamera ini akan hilang dari halaman Video."
        confirmLabel="Hapus"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
