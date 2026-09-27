import {
  AlertTriangle,
  Info,
  type LucideIcon,
  OctagonAlert,
} from "lucide-react";
import type { EventSeverity } from "@/types/event";

export const SEVERITY_STYLE: Record<
  EventSeverity,
  { icon: LucideIcon; text: string; border: string }
> = {
  info: { icon: Info, text: "text-cyan", border: "border-l-cyan/40" },
  warning: {
    icon: AlertTriangle,
    text: "text-amber",
    border: "border-l-amber",
  },
  critical: { icon: OctagonAlert, text: "text-red", border: "border-l-red" },
};
