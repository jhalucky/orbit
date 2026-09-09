"use client";

import { CircleHelp, Settings } from "lucide-react";
import Link from "next/link";
import { LocationSelector } from "@/components/navigation/LocationSelector";
import { Wordmark } from "@/components/navigation/Wordmark";

const ICON = { size: 18, strokeWidth: 1.65 };

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-paper px-4 md:hidden">
      <Wordmark />
      <div className="flex items-center gap-1">
        <LocationSelector variant="compact" />
        <Link
          href="/help"
          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-ink-soft hover:bg-card hover:text-ink"
          aria-label="Help & Support"
        >
          <CircleHelp {...ICON} />
        </Link>
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-ink-soft hover:bg-card hover:text-ink"
          aria-label="Settings"
        >
          <Settings {...ICON} />
        </Link>
      </div>
    </header>
  );
}
