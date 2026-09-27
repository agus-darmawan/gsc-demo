import type { Metadata } from "next";
import { DronesView } from "./_components/drones-view";

export const metadata: Metadata = { title: "Drone" };

export default function DronesPage() {
  return <DronesView />;
}
