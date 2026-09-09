import type { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { MobileTopBar } from "./MobileTopBar";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <Sidebar />
      <div className="md:pl-[72px] lg:pl-[240px]">
        <MobileTopBar />
        <div className="pb-20 md:pb-0">{children}</div>
      </div>
      <MobileNav />
    </div>
  );
}
