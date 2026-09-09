"use client";

import { Bookmark, Compass, Inbox, MessagesSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import Link from "next/link";

const ICON = { size: 20, strokeWidth: 1.65 };

const ITEMS = [
  { href: "/", label: "Discover", icon: Compass, match: (path: string) => path === "/" },
  { href: "/requests", label: "Requests", icon: Inbox, match: (path: string) => path.startsWith("/requests") },
  { href: "/messages", label: "Messages", icon: MessagesSquare, match: (path: string) => path.startsWith("/messages") },
  { href: "/saved", label: "Saved", icon: Bookmark, match: (path: string) => path.startsWith("/saved") },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-accent" : "text-ink-soft",
                )}
              >
                <item.icon {...ICON} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
