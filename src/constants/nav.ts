import {
  Bot,
  Cctv,
  Crosshair,
  type LucideIcon,
  Map as MapIcon,
  Navigation,
  Plane,
  Route,
  ScrollText,
  Settings,
  Video,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Operational views (QGroundControl style: fly, plan, drop, overview, video). */
export const NAV_OPERATIONS: readonly NavItem[] = [
  { href: "/dashboard/fly", label: "Terbang", icon: Navigation },
  { href: "/dashboard/plan", label: "Misi", icon: Route },
  { href: "/dashboard/drop", label: "Titik drop", icon: Crosshair },
  { href: "/dashboard/map", label: "Peta armada", icon: MapIcon },
  { href: "/dashboard/video", label: "Video", icon: Video },
];

/** Administration views. */
export const NAV_SYSTEM: readonly NavItem[] = [
  { href: "/dashboard/drones", label: "Drone", icon: Plane },
  { href: "/dashboard/cameras", label: "Kamera", icon: Cctv },
  { href: "/dashboard/models", label: "Model AI", icon: Bot },
  { href: "/dashboard/logs", label: "Log", icon: ScrollText },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];
