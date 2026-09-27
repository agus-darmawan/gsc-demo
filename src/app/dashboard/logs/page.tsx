import type { Metadata } from "next";
import { LogsView } from "./_components/logs-view";

export const metadata: Metadata = { title: "Log" };

export default function LogsPage() {
  return <LogsView />;
}
