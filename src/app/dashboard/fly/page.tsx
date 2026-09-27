import type { Metadata } from "next";
import { FlyView } from "./_components/fly-view";

export const metadata: Metadata = { title: "Terbang" };

export default function FlyPage() {
  return <FlyView />;
}
