"use client";

import {
  ClipboardList,
  Inbox,
  LayoutGrid,
  MessagesSquare,
  Settings,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NavItem } from "@/components/navigation/NavItem";
import { Wordmark } from "@/components/navigation/Wordmark";
import { useApp } from "@/lib/app-context";

const ICON = { size: 18, strokeWidth: 1.65 };

const PRIMARY = [
  { href: "/provider", label: "Overview", icon: LayoutGrid, match: (path: string) => path === "/provider" },
  { href: "/provider/requests", label: "Requests", icon: Inbox, match: (path: string) => path.startsWith("/provider/requests") },
  { href: "/messages", label: "Messages", icon: MessagesSquare, match: (path: string) => path.startsWith("/messages") },
  { href: "/provider/services", label: "Services", icon: ClipboardList, match: (path: string) => path.startsWith("/provider/services") },
  { href: "/provider/profile", label: "Business profile", icon: Store, match: (path: string) => path.startsWith("/provider/profile") },
] as const;

export function ProviderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useApp();

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-line bg-paper md:flex lg:w-[240px]">
        <div className="flex h-16 items-center px-4 lg:px-5">
          <span className="lg:hidden">
            <Wordmark compact />
          </span>
          <span className="hidden lg:block">
            <Wordmark />
          </span>
        </div>
        <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-2 lg:px-3" aria-label="Business">
          {PRIMARY.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon {...ICON} />}
              active={item.match(pathname)}
            />
          ))}
        </nav>
        <div className="px-2 pb-3 lg:px-3">
          <NavItem
            href="/settings"
            label="Settings"
            icon={<Settings {...ICON} />}
            active={pathname.startsWith("/settings")}
          />
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-[6px] py-2 hover:bg-card lg:justify-start lg:px-2.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[20px] bg-ink text-[11px] font-medium text-paper">
              {user?.initials}
            </span>
            <span className="hidden min-w-0 text-left lg:block">
              <span className="block truncate text-[13px] text-ink">
                {user?.businessName ?? user?.name}
              </span>
              <span className="block text-[12px] text-ink-soft">Business</span>
            </span>
          </button>
        </div>
      </aside>
      <div className="pb-16 md:pl-[72px] md:pb-0 lg:pl-[240px]">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-paper md:hidden">
        {PRIMARY.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] ${item.match(pathname) ? "text-accent" : "text-ink-soft"}`}
          >
            <item.icon size={20} strokeWidth={1.65} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
