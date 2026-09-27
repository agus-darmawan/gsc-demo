"use client";

import { ChevronDown, KeyRound, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDismissable } from "@/hooks/use-dismissable";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import type { UserRole } from "@/types/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrator",
  operator: "Operator",
  observer: "Pengamat",
};

export function UserMenu() {
  const user = useAuthStore((s) => s.session?.user);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();
  const { open, toggle, setOpen, ref } = useDismissable<HTMLDivElement>();

  if (!user) return null;

  const logout = async () => {
    setOpen(false);
    await api.auth.logout().catch(() => undefined);
    clear();
    router.replace("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-8 items-center gap-2 border border-border-subtle px-2 hover:border-border"
      >
        <Shield size={12} className="text-txt-muted" aria-hidden />
        <span className="font-mono text-[10px] text-txt-muted uppercase">
          {ROLE_LABEL[user.role]}
        </span>
        <span className="max-w-32 truncate text-xs text-txt-secondary">
          {user.displayName}
        </span>
        <ChevronDown size={12} className="text-txt-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="panel-elevated absolute top-full right-0 z-50 mt-1 w-60 shadow-xl shadow-black/50 motion-safe:animate-fade-in"
        >
          <div className="border-b border-border-subtle px-3 py-2.5">
            <p className="text-sm text-txt-primary">{user.displayName}</p>
            <p className="font-mono text-[11px] text-txt-tertiary">
              @{user.username}
            </p>
            {user.unit && (
              <p className="mt-1 text-[11px] text-txt-secondary">{user.unit}</p>
            )}
          </div>
          <Link
            role="menuitem"
            href="/dashboard/settings?tab=account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-txt-secondary hover:bg-gcs-tertiary hover:text-txt-primary"
          >
            <KeyRound size={13} aria-hidden />
            Ganti kata sandi
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 border-t border-border-subtle px-3 py-2 text-left text-xs text-red hover:bg-red/10"
          >
            <LogOut size={13} aria-hidden />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
