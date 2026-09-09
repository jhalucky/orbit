"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { CustomerShell } from "./CustomerShell";
import { ProviderShell } from "./ProviderShell";
import { useApp } from "@/lib/app-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.activeRole && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }
    if (user.activeRole === "provider" && pathname === "/") {
      router.replace("/provider");
    }
    if (user.activeRole === "customer" && pathname.startsWith("/provider")) {
      router.replace("/");
    }
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper text-sm text-ink-soft">
        Loading Orbit…
      </div>
    );
  }

  if (user.activeRole === "provider") {
    return <ProviderShell>{children}</ProviderShell>;
  }

  return <CustomerShell>{children}</CustomerShell>;
}
