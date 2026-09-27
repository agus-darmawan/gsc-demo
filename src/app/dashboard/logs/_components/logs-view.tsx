"use client";

import { History, ScrollText } from "lucide-react";
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useEventStore } from "@/stores/use-event-store";
import { EventLog } from "./event-log";
import { FlightLog } from "./flight-log";

type Tab = "events" | "flights";

export function LogsView() {
  const [tab, setTab] = useState<Tab>("events");
  const count = useEventStore((s) => s.events.length);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-end gap-4 border-b border-border-subtle bg-gcs-primary px-4">
        <h1 className="pb-3 text-sm font-semibold">Log</h1>
        <Tabs<Tab>
          ariaLabel="Jenis log"
          value={tab}
          onChange={setTab}
          className="border-b-0"
          items={[
            { value: "events", label: "Kejadian", icon: ScrollText, count },
            { value: "flights", label: "Riwayat terbang", icon: History },
          ]}
        />
      </div>
      {tab === "events" ? <EventLog /> : <FlightLog />}
    </div>
  );
}
