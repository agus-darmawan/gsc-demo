import { useEventStore } from "@/stores/use-event-store";

/** Fire-and-forget operator notifications. */
export const toast = {
  success: (title: string, description?: string) =>
    useEventStore.getState().notify({ tone: "success", title, description }),
  info: (title: string, description?: string) =>
    useEventStore.getState().notify({ tone: "info", title, description }),
  warning: (title: string, description?: string) =>
    useEventStore.getState().notify({ tone: "warning", title, description }),
  error: (title: string, description?: string) =>
    useEventStore.getState().notify({ tone: "error", title, description }),
};
