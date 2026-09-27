"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/providers/auth-guard";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "./footer";
import { Header } from "./header";
import { StatusBar } from "./status-bar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen flex-col overflow-hidden bg-gcs-root font-sans text-txt-primary">
        <a href="#main-content" className="skip-link">
          Lewati ke konten utama
        </a>
        <Header />
        <StatusBar />
        <RealtimeProvider />
        <main
          id="main-content"
          tabIndex={-1}
          className="relative flex min-h-0 w-full flex-1 overflow-hidden outline-none"
        >
          {children}
        </main>
        <Footer />
        <Toaster />
      </div>
    </AuthGuard>
  );
}
