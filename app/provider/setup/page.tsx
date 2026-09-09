"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  ShopForm,
  emptyShopDraft,
  shopFormValid,
  shopPayload,
  type ShopDraft,
} from "@/components/provider/ShopForm";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { Category, ProviderBusiness } from "@/lib/types";

export default function ProviderSetupPage() {
  const router = useRouter();
  const { refreshUser, neighbourhoods, user } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState(neighbourhoods);
  const [draft, setDraft] = useState<ShopDraft>(emptyShopDraft());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (neighbourhoods.length) setPlaces(neighbourhoods);
  }, [neighbourhoods]);

  useEffect(() => {
    api<Category[]>("/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
    api<ProviderBusiness>("/provider/business")
      .then((shop) => {
        setDraft({
          name: shop.name,
          categoryId: shop.categoryId === "more" && !shop.profileComplete ? "" : shop.categoryId,
          locationId: shop.locationId ?? "",
          address: shop.address.includes("Add your address") ? "" : shop.address,
          description: shop.description.includes("Tell customers what you do")
            ? ""
            : shop.description,
          typicalResponseMinutes: shop.typicalResponseMinutes,
          hours: shop.hours.length ? shop.hours : emptyShopDraft().hours,
          services: shop.services.length
            ? shop.services
            : [{ name: "", description: "" }],
        });
      })
      .catch(() => undefined);
  }, []);

  async function save() {
    setError(null);
    setPending(true);
    try {
      await api("/provider/business", {
        method: "PATCH",
        body: JSON.stringify(shopPayload(draft)),
      });
      await refreshUser();
      router.replace("/provider");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your shop");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[36rem] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[12px] text-ink-soft">Set up your shop</p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight font-medium text-ink">
          How should customers find you?
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-soft">
          Name, neighbourhood, and the work you take. You can change this any
          time from your dashboard.
        </p>

        <div className="mt-8">
          <ShopForm
            value={draft}
            onChange={setDraft}
            categories={categories}
            neighbourhoods={places.length ? places : neighbourhoods}
          />
        </div>

        {error ? <p className="mt-4 text-[13px] text-accent">{error}</p> : null}

        <Button
          className="mt-6"
          disabled={pending || !shopFormValid(draft)}
          onClick={() => void save()}
        >
          {pending ? "Saving…" : `Publish ${user?.businessName ? "your shop" : "and open dashboard"}`}
        </Button>
      </div>
    </AppShell>
  );
}
