"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { ViewLoading } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { useAppStore } from "@/stores/use-app-store";
import { isSessionValid, useAuthStore } from "@/stores/use-auth-store";

/** Client-side route protection (static export has no server middleware). */
export function AuthGuard({ children }: { children: ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAuthStore((s) => s.session);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const pathname = usePathname();
  const valid = isSessionValid(session);
  const token = session?.accessToken ?? null;

  useEffect(() => {
    if (!hydrated || valid) return;
    useAuthStore.getState().clear();
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, valid, router, pathname]);

  // Validate the stored token once per session; a 401 clears it.
  useEffect(() => {
    if (!hydrated || !token) return;
    api.auth
      .me()
      .then(setUser)
      .catch(() => undefined);
  }, [hydrated, token, setUser]);

  if (!hydrated || !valid) {
    return (
      <div className="flex h-screen bg-gcs-root">
        <ViewLoading label="Memeriksa sesi…" />
      </div>
    );
  }
  return children;
}
