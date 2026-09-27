import type { Metadata } from "next";
import { Suspense } from "react";
import { ViewLoading } from "@/components/ui/loading";
import { FleetMap } from "./_components/fleet-map";

export const metadata: Metadata = { title: "Peta armada" };

export default function MapPage() {
  return (
    <Suspense fallback={<ViewLoading />}>
      <FleetMap />
    </Suspense>
  );
}
