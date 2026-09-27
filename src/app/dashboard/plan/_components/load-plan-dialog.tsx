"use client";

import { FolderOpen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/loading";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { MissionPlan, MissionSummary } from "@/types/mission";

interface LoadPlanDialogProps {
  open: boolean;
  droneId: string;
  onClose: () => void;
  onLoad: (plan: MissionPlan) => void;
}

export function LoadPlanDialog({
  open,
  droneId,
  onClose,
  onLoad,
}: LoadPlanDialogProps) {
  const [items, setItems] = useState<MissionSummary[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setItems(null);
    try {
      setItems(await api.missions.list(droneId));
    } catch (error) {
      toast.error("Gagal memuat daftar rencana", errorMessage(error));
      setItems([]);
    }
  }, [droneId]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const load = async (id: string) => {
    setBusyId(id);
    try {
      onLoad(await api.missions.get(id));
      onClose();
    } catch (error) {
      toast.error("Gagal memuat rencana", errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: MissionSummary) => {
    setBusyId(item.id);
    try {
      await api.missions.remove(item.id);
      toast.success(`Rencana "${item.name}" dihapus`);
      await refresh();
    } catch (error) {
      toast.error("Gagal menghapus rencana", errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Muat rencana tersimpan"
      description="Rencana yang tersimpan di server untuk drone ini."
    >
      {items === null ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Belum ada rencana tersimpan" />
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 border border-border-subtle px-2.5 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-txt-primary">{item.name}</p>
                <p className="font-mono text-[10px] text-txt-tertiary">
                  {item.waypointCount} titik, diubah{" "}
                  {formatDateTime(item.updatedAt)}
                </p>
              </div>
              <Button
                size="xs"
                variant="primary"
                loading={busyId === item.id}
                onClick={() => load(item.id)}
              >
                Muat
              </Button>
              <IconButton
                size="xs"
                variant="ghost"
                icon={Trash2}
                label="Hapus rencana"
                disabled={busyId !== null}
                onClick={() => remove(item)}
              />
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
