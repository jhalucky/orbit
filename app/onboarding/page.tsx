"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Wordmark } from "@/components/navigation/Wordmark";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { SessionUser } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useApp();
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"customer" | "provider" | null>(null);

  async function choose(role: "customer" | "provider") {
    setError(null);
    setPending(role);
    try {
      const user = await api<SessionUser>("/auth/role", {
        method: "POST",
        body: JSON.stringify({
          role,
          business_name: role === "provider" ? businessName : undefined,
        }),
      });
      await refreshUser();
      router.replace(user.activeRole === "provider" ? "/provider" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not continue");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[28rem] flex-col justify-center px-4 py-12">
      <Wordmark />
      <h1 className="mt-8 font-display text-[2rem] leading-tight font-medium text-ink">
        How will you use Orbit?
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        You can add the other role later. This just sets where you land today.
      </p>

      <button
        type="button"
        onClick={() => choose("customer")}
        disabled={pending !== null}
        className="mt-8 rounded-[8px] border border-line bg-card px-4 py-4 text-left hover:border-ink/20"
      >
        <p className="font-medium text-ink">I need a service</p>
        <p className="mt-1 text-[13px] text-ink-soft">
          Find a nearby business and message them.
        </p>
      </button>

      <div className="mt-3 rounded-[8px] border border-line bg-card px-4 py-4">
        <p className="font-medium text-ink">I run a business</p>
        <p className="mt-1 text-[13px] text-ink-soft">
          Receive requests from people around you.
        </p>
        <Input
          className="mt-3"
          placeholder="Business name"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
        />
        <Button
          className="mt-3"
          disabled={pending !== null || businessName.trim().length < 2}
          onClick={() => choose("provider")}
        >
          Continue as a business
        </Button>
      </div>

      {error ? <p className="mt-4 text-[13px] text-accent">{error}</p> : null}
    </div>
  );
}
