"use client";

import { Radio } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/constants/defaults";
import { APP_VERSION, USE_MOCK } from "@/lib/api";
import { AlertsButton } from "./alerts-button";
import { MainNav } from "./main-nav";
import { RealtimeIndicator } from "./realtime-indicator";
import { UserMenu } from "./user-menu";

export function Header() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle bg-gcs-primary px-3">
      <Link href="/dashboard/fly" className="flex shrink-0 items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center border border-cyan/30 bg-cyan/10">
          <Radio size={14} className="text-cyan" aria-hidden />
        </span>
        <span className="font-mono text-sm font-bold tracking-tight text-txt-primary">
          {APP_NAME}
        </span>
        <span className="hidden font-mono text-[10px] text-txt-muted xl:inline">
          v{APP_VERSION}
        </span>
      </Link>

      <span className="h-5 w-px bg-border-subtle" aria-hidden />
      <MainNav />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {USE_MOCK && (
          <Badge tone="violet" className="hidden lg:inline-flex">
            MODE DEMO
          </Badge>
        )}
        <RealtimeIndicator />
        <AlertsButton />
        <UserMenu />
      </div>
    </header>
  );
}
