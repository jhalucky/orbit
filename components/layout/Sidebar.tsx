"use client";

import {
  Bookmark,
  CircleHelp,
  Compass,
  Inbox,
  MessagesSquare,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { LocationSelector } from "@/components/navigation/LocationSelector";
import { NavItem } from "@/components/navigation/NavItem";
import { Wordmark } from "@/components/navigation/Wordmark";

const ICON = { size: 18, strokeWidth: 1.65 };

const PRIMARY = [
  { href: "/", label: "Discover", icon: Compass, match: (path: string) => path === "/" || path.startsWith("/business") },
  { href: "/requests", label: "Requests", icon: Inbox, match: (path: string) => path.startsWith("/requests") },
  { href: "/messages", label: "Messages", icon: MessagesSquare, match: (path: string) => path.startsWith("/messages") },
  { href: "/saved", label: "Saved", icon: Bookmark, match: (path: string) => path.startsWith("/saved") },
] as const;

const SECONDARY = [
  { href: "/help", label: "Help & Support", icon: CircleHelp, match: (path: string) => path.startsWith("/help") },
  { href: "/settings", label: "Settings", icon: Settings, match: (path: string) => path.startsWith("/settings") },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useApp();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-line bg-paper md:flex lg:w-[240px]">
      <div className="flex h-16 items-center px-4 lg:px-5">
        <span className="lg:hidden">
          <Wordmark compact />
        </span>
        <span className="hidden lg:block">
          <Wordmark />
        </span>
      </div>

      <div className="px-2 lg:px-3">
        <LocationSelector variant="sidebar" />
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5 px-2 lg:px-3" aria-label="Customer">
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

      <div className="flex flex-col gap-0.5 px-2 pb-3 lg:px-3">
        {SECONDARY.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon {...ICON} />}
            active={item.match(pathname)}
          />
        ))}

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-[6px] py-2 hover:bg-card lg:justify-start lg:px-2.5"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[20px] bg-ink text-[11px] font-medium tracking-wide text-paper">
            {user?.initials ?? "?"}
          </span>
          <span className="hidden min-w-0 lg:block">
            <span className="block truncate text-[13px] text-ink">
              {user?.name ?? "Account"}
            </span>
            <span className="block text-[12px] text-ink-soft">Customer</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
