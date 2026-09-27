"use client";

import { Bot, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ViewLoading } from "@/components/ui/loading";
import { PageToolbar } from "@/components/ui/page-toolbar";
import { MODEL_FORMAT_LABEL, MODEL_STATUS_LABEL } from "@/constants/labels";
import { api, errorMessage } from "@/lib/api";
import { formatBytes, formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useModelStore } from "@/stores/use-model-store";
import { useStreamStore } from "@/stores/use-stream-store";
import type { DetectionModel, ModelStatus } from "@/types/model";
import { ModelEditDialog } from "./model-edit-dialog";
import { ModelUpload } from "./model-upload";

const STATUS_TONE: Record<ModelStatus, BadgeTone> = {
  uploaded: "neutral",
  loading: "info",
  loaded: "success",
  failed: "danger",
};

const VISIBLE_CLASSES = 4;

/** Detection model registry: upload, load into / unload from the GPU worker. */
export function ModelsView() {
  const models = useModelStore((s) => s.models);
  const status = useModelStore((s) => s.status);
  const loadError = useModelStore((s) => s.error);
  const load = useModelStore((s) => s.load);
  const upsert = useModelStore((s) => s.upsert);
  const removeModel = useModelStore((s) => s.remove);
  const invalidateStreams = useStreamStore((s) => s.invalidate);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<DetectionModel | null>(null);
  const [deleting, setDeleting] = useState<DetectionModel | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = useMemo(
    () => models.filter((m) => m.status === "loaded").length,
    [models],
  );

  const toggleLoad = async (model: DetectionModel) => {
    const unloading = model.status === "loaded";
    setBusyId(model.id);
    if (!unloading) upsert({ ...model, status: "loading", error: null });
    try {
      const updated = unloading
        ? await api.models.unload(model.id)
        : await api.models.load(model.id);
      upsert(updated);
      invalidateStreams();
      if (updated.status === "failed")
        toast.error(
          `Gagal memuat "${updated.name}"`,
          updated.error ?? undefined,
        );
      else
        toast.success(
          unloading
            ? `"${updated.name}" dilepas dari server`
            : `"${updated.name}" aktif`,
        );
    } catch (error) {
      upsert(model);
      toast.error(
        unloading ? "Gagal melepas model" : "Gagal memuat model",
        errorMessage(error),
      );
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await api.models.remove(deleting.id);
      removeModel(deleting.id);
      toast.success(`Model "${deleting.name}" dihapus`);
      setDeleting(null);
    } catch (error) {
      toast.error("Gagal menghapus model", errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex min-w-0 flex-1">
      <ModelUpload />

      <div className="flex min-w-0 flex-1 flex-col">
        <PageToolbar
          title="Model AI"
          meta={`${models.length} model, ${activeCount} aktif`}
        >
          <IconButton
            icon={RefreshCw}
            label="Muat ulang"
            variant="ghost"
            onClick={() => void load(true)}
          />
        </PageToolbar>

        <div className="min-h-0 flex-1 overflow-auto">
          {status === "loading" && models.length === 0 ? (
            <ViewLoading label="Memuat daftar model…" />
          ) : status === "error" && models.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="Gagal memuat model"
              description={loadError ?? undefined}
              action={
                <Button onClick={() => void load(true)}>Coba lagi</Button>
              }
            />
          ) : models.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="Belum ada model"
              description="Unggah file bobot deteksi di panel kiri."
            />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-gcs-primary">
                <tr className="border-b border-border-subtle">
                  {[
                    "Model",
                    "Format",
                    "Kelas",
                    "Input",
                    "Ukuran",
                    "Status",
                    "Diunggah",
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
                {models.map((model) => {
                  const busy = busyId === model.id;
                  const loading = model.status === "loading";
                  const extra = model.classes.length - VISIBLE_CLASSES;
                  return (
                    <tr
                      key={model.id}
                      className="border-b border-border-subtle align-top hover:bg-gcs-secondary/60"
                    >
                      <td className="max-w-72 px-3 py-2.5">
                        <div className="text-xs text-txt-primary">
                          {model.name}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-txt-muted">
                          <span
                            className="size-2"
                            style={{ backgroundColor: model.color }}
                            aria-hidden
                          />
                          {model.key} · conf {model.confidence.toFixed(2)}
                          {model.everyN > 1 && ` · tiap ${model.everyN} frame`}
                          {model.classFilter.length > 0 &&
                            ` · ${model.classFilter.length} kelas`}
                        </div>
                        {model.description && (
                          <div className="mt-0.5 text-[11px] leading-snug text-txt-tertiary">
                            {model.description}
                          </div>
                        )}
                        <div className="mt-0.5 truncate font-mono text-[10px] text-txt-muted">
                          {model.fileName}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] whitespace-nowrap text-txt-secondary">
                        {MODEL_FORMAT_LABEL[model.format]}
                      </td>
                      <td className="max-w-56 px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {model.classes.slice(0, VISIBLE_CLASSES).map((c) => (
                            <Badge key={c}>{c}</Badge>
                          ))}
                          {extra > 0 && (
                            <span
                              className="font-mono text-[10px] text-txt-tertiary"
                              title={model.classes.join(", ")}
                            >
                              +{extra}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-txt-secondary">
                        {model.inputSize ? `${model.inputSize}px` : "--"}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-txt-secondary">
                        {formatBytes(model.fileSizeBytes)}
                      </td>
                      <td className="max-w-56 px-3 py-2.5">
                        <Badge tone={STATUS_TONE[model.status]}>
                          {loading && (
                            <Loader2
                              size={10}
                              className="animate-spin"
                              aria-hidden
                            />
                          )}
                          {MODEL_STATUS_LABEL[model.status]}
                        </Badge>
                        {model.status === "failed" && model.error && (
                          <p className="mt-1 text-[10px] leading-snug text-red">
                            {model.error}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] whitespace-nowrap text-txt-tertiary">
                        {formatDateTime(model.uploadedAt)}
                        {model.uploadedBy && <div>oleh {model.uploadedBy}</div>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="xs"
                            variant={
                              model.status === "loaded"
                                ? "secondary"
                                : "primary"
                            }
                            loading={busy && !loading}
                            disabled={loading || busy}
                            onClick={() => toggleLoad(model)}
                          >
                            {model.status === "loaded"
                              ? "Lepas"
                              : model.status === "failed"
                                ? "Coba muat"
                                : "Muat"}
                          </Button>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            icon={Pencil}
                            label={`Ubah ${model.name}`}
                            disabled={busy}
                            onClick={() => setEditing(model)}
                          />
                          <IconButton
                            size="xs"
                            variant="ghost"
                            icon={Trash2}
                            label={`Hapus ${model.name}`}
                            disabled={busy || model.status === "loaded"}
                            title={
                              model.status === "loaded"
                                ? "Lepas model terlebih dahulu"
                                : undefined
                            }
                            onClick={() => setDeleting(model)}
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
        <ModelEditDialog model={editing} onClose={() => setEditing(null)} />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title={deleting ? `Hapus model "${deleting.name}"?` : ""}
        message="File bobot akan dihapus dari server dan tidak bisa dikembalikan."
        confirmLabel="Hapus model"
        loading={deleting ? busyId === deleting.id : false}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
