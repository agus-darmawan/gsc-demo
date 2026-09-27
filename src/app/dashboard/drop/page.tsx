import type { Metadata } from "next";
import { DropView } from "./_components/drop-view";

export const metadata: Metadata = { title: "Titik drop" };

export default function DropPage() {
  return <DropView />;
}
