import type { Metadata } from "next";
import { CamerasView } from "./_components/cameras-view";

export const metadata: Metadata = { title: "Kamera" };

export default function CamerasPage() {
  return <CamerasView />;
}
