import type { Metadata } from "next";
import { Suspense } from "react";
import { ViewLoading } from "@/components/ui/loading";
import { FocusRoute } from "../_components/focus-route";

export const metadata: Metadata = { title: "Fokus video" };

export default function VideoFocusPage() {
  return (
    <Suspense fallback={<ViewLoading />}>
      <FocusRoute />
    </Suspense>
  );
}
