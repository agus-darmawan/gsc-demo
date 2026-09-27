"use client";

import { useCallback, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { CommandAck, VehicleCommand } from "@/types/command";

/** Sends a vehicle command and reports the acknowledgement as a toast. */
export function useVehicleCommand() {
  const [busy, setBusy] = useState(false);

  const send = useCallback(
    async (
      droneId: string,
      command: VehicleCommand,
    ): Promise<CommandAck | null> => {
      setBusy(true);
      try {
        const ack = await api.vehicle.send(droneId, command);
        if (ack.accepted) toast.success(ack.message);
        else toast.warning("Perintah ditolak", ack.message);
        return ack;
      } catch (error) {
        toast.error("Perintah gagal dikirim", errorMessage(error));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { send, busy };
}
