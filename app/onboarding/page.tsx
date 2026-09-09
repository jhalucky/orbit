"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Wordmark } from "@/components/navigation/Wordmark";
import {
  ShopForm,
  emptyShopDraft,
  shopFormValid,
  shopPayload,
  type ShopDraft,
} from "@/components/provider/ShopForm";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { Category, SessionUser } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser, neighbourhoods } = useApp();
  const [businessName, setBusinessName] = useState("");
  const [shopOpen, setShopOpen] = useState(false);
  const [draft, setDraft] = useState<ShopDraft>(emptyShopDraft());
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"customer" | "provider" | null>(null);

  async function chooseCustomer() {
    setError(null);
    setPending("customer");
    try {
      await api<SessionUser>("/auth/role", {
        method: "POST",
        body: JSON.stringify({ role: "customer" }),
      });
      await refreshUser();
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not continue");
    } finally {
      setPending(null);
    }
  }

  async function openShopForm() {
    setError(null);
    if (businessName.trim().length < 2) {
      setError("Give your business a name first.");
      return;
    }
    const cats = await api<Category[]>("/categories").catch(() => [] as Category[]);
    setCategories(cats);
    setDraft((current) => ({ ...current, name: businessName.trim() }));
    setShopOpen(true);
  }

  async function chooseProvider() {
    setError(null);
    setPending("provider");
    try {
      const payload = shopPayload(draft);
      const user = await api<SessionUser>("/auth/role", {
        method: "POST",
        body: JSON.stringify({
          role: "provider",
          business_name: payload.name,
          category_id: payload.category_id,
          location_id: payload.location_id,
          address: payload.address,
          description: payload.description,
          services: payload.services,
        }),
      });
      await refreshUser();
      router.replace(user.shopComplete ? "/provider" : "/provider/setup");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not continue");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[32rem] flex-col justify-center px-4 py-12">
      <Wordmark />
      <h1 className="mt-8 font-display text-[2rem] leading-tight font-medium text-ink">
        How will you use Orbit?
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        You can add the other role later. A shop needs a place and the work you
        take before customers can find you.
      </p>

      <button
        type="button"
        onClick={() => void chooseCustomer()}
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
        {!shopOpen ? (
          <>
            <Input
              className="mt-3"
              placeholder="Business name"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
            <Button
              className="mt-3"
              disabled={pending !== null || businessName.trim().length < 2}
              onClick={() => void openShopForm()}
            >
              Continue as a business
            </Button>
          </>
        ) : (
          <div className="mt-4">
            <ShopForm
              value={draft}
              onChange={setDraft}
              categories={categories}
              neighbourhoods={neighbourhoods}
              showHours={false}
            />
            <Button
              className="mt-4"
              disabled={pending !== null || !shopFormValid(draft)}
              onClick={() => void chooseProvider()}
            >
              {pending === "provider" ? "Saving…" : "Open my shop"}
            </Button>
          </div>
        )}
      </div>

      {error ? <p className="mt-4 text-[13px] text-accent">{error}</p> : null}
    </div>
  );
}
