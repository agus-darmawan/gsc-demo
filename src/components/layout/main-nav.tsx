"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_OPERATIONS, NAV_SYSTEM, type NavItem } from "@/constants/nav";
import { cn } from "@/lib/utils";

function NavLink({ item, compact }: { item: NavItem; compact: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={cn(
        "flex h-8 items-center gap-1.5 border px-2.5 text-xs transition-colors",
        active
          ? "border-cyan/40 bg-cyan/5 text-cyan"
          : "border-transparent text-txt-tertiary hover:border-border-subtle hover:text-txt-secondary",
      )}
    >
      <Icon size={13} aria-hidden />
      <span className={cn(compact && "hidden 2xl:inline")}>{item.label}</span>
    </Link>
  );
}

export function MainNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="flex min-w-0 items-center gap-0.5"
    >
      {NAV_OPERATIONS.map((item) => (
        <NavLink key={item.href} item={item} compact={false} />
      ))}
      <span className="mx-2 h-5 w-px bg-border-subtle" aria-hidden />
      {NAV_SYSTEM.map((item) => (
        <NavLink key={item.href} item={item} compact />
      ))}
    </nav>
  );
}
