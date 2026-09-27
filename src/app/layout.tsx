import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { StoreHydrator } from "@/components/providers/store-hydrator";
import { APP_NAME, APP_TAGLINE } from "@/constants/defaults";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_TAGLINE,
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  themeColor: "#080c10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body>
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
