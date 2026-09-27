import type { Metadata } from "next";
import { Suspense } from "react";
import { ViewLoading } from "@/components/ui/loading";
import { SettingsView } from "./_components/settings-view";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<ViewLoading />}>
      <SettingsView />
    </Suspense>
  );
}
