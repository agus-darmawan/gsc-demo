"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ViewLoading } from "@/components/ui/loading";
import { useAppStore } from "@/stores/use-app-store";
import { isSessionValid, useAuthStore } from "@/stores/use-auth-store";

/** Client-side redirect (static export cannot redirect on the server). */
export function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return <ViewLoading />;
}

/** Entry point: dashboard when signed in, login otherwise. */
export function RootRedirect() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(isSessionValid(session) ? "/dashboard/fly" : "/login");
  }, [hydrated, session, router]);

  return (
    <div className="flex h-screen bg-gcs-root">
      <ViewLoading />
    </div>
  );
}
