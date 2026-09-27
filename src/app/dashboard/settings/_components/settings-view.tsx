"use client";

import { Bot, Info, Monitor, Server, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type TabItem, Tabs } from "@/components/ui/tabs";
import { AboutSection } from "./about-section";
import { AccountSection } from "./account-section";
import { AssistantSection } from "./assistant-section";
import { ConnectionSection } from "./connection-section";
import { DisplaySection } from "./display-section";

type Tab = "account" | "display" | "assistant" | "connection" | "about";

const TABS: readonly TabItem<Tab>[] = [
  { value: "account", label: "Akun", icon: UserRound },
  { value: "display", label: "Tampilan", icon: Monitor },
  { value: "assistant", label: "Asisten AI", icon: Bot },
  { value: "connection", label: "Koneksi", icon: Server },
  { value: "about", label: "Tentang", icon: Info },
];

const isTab = (value: string | null): value is Tab =>
  TABS.some((t) => t.value === value);

export function SettingsView() {
  const params = useSearchParams();
  const router = useRouter();
  const requested = params.get("tab");
  const tab: Tab = isTab(requested) ? requested : "account";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-end gap-4 border-b border-border-subtle bg-gcs-primary px-4">
        <h1 className="pb-3 text-sm font-semibold">Pengaturan</h1>
        <Tabs<Tab>
          ariaLabel="Bagian pengaturan"
          value={tab}
          items={TABS}
          className="border-b-0"
          onChange={(next) =>
            router.replace(`/dashboard/settings?tab=${next}`, { scroll: false })
          }
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
          {tab === "account" && <AccountSection />}
          {tab === "display" && <DisplaySection />}
          {tab === "assistant" && <AssistantSection />}
          {tab === "connection" && <ConnectionSection />}
          {tab === "about" && <AboutSection />}
        </div>
      </div>
    </div>
  );
}
