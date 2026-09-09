"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface NavItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
}

export function NavItem({ href, label, icon, active }: NavItemProps) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "group relative flex h-10 items-center justify-center rounded-[6px] text-[13px] transition-colors duration-150 lg:h-9 lg:justify-start lg:gap-2.5 lg:px-2.5",
        active
          ? "bg-accent-soft text-ink"
          : "text-ink-soft hover:bg-card hover:text-ink",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 left-0 hidden w-[2px] rounded-r-[1px] bg-accent lg:block"
        />
      ) : null}
      <span
        className={cn(
          "flex h-[18px] w-[18px] items-center justify-center",
          active ? "text-accent" : "text-ink-soft group-hover:text-ink",
        )}
      >
        {icon}
      </span>
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}
