"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { user, logout } = useApp();

  return (
    <AppShell>
      <div className="mx-auto max-w-[34rem] px-4 py-12 md:px-8">
        <p className="text-[12px] text-ink-soft">Settings</p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight font-medium text-ink">
          {user?.name}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">{user?.email}</p>
        <p className="mt-1 text-[13px] text-ink-soft">
          Signed in as {user?.activeRole === "provider" ? "a business" : "a customer"}
          {user?.businessName ? ` · ${user.businessName}` : ""}
        </p>
        <div className="mt-8">
          <Button variant="secondary" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
