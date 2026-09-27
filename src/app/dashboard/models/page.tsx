import type { Metadata } from "next";
import { ModelsView } from "./_components/models-view";

export const metadata: Metadata = { title: "Model AI" };

export default function ModelsPage() {
  return <ModelsView />;
}
