import type { Metadata } from "next";
import { VideoGrid } from "./_components/video-grid";

export const metadata: Metadata = { title: "Video" };

export default function VideoPage() {
  return <VideoGrid />;
}
