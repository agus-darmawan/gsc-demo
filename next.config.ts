import type { NextConfig } from "next";

/**
 * The GCS is a fully client-side app: every piece of data comes from the
 * backend at runtime (NEXT_PUBLIC_API_URL). A static export lets the same
 * build run on any static host and inside the Tauri desktop shell.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;
