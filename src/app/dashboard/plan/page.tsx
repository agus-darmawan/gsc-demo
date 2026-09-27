import type { Metadata } from "next";
import { PlanView } from "./_components/plan-view";

export const metadata: Metadata = { title: "Rencana misi" };

export default function PlanPage() {
  return <PlanView />;
}
