"use client";

import { BusinessCard } from "@/components/businesses/BusinessCard";
import { AppShell } from "@/components/layout/AppShell";
import { useCustomer } from "@/lib/customer-context";
import { sortByDistance } from "@/lib/discover";
import { BUSINESSES } from "@/lib/seed";

export function SavedPage() {
  const { savedIds, isSaved, toggleSaved, location } = useCustomer();
  const businesses = sortByDistance(
    BUSINESSES.filter((business) => savedIds.has(business.id)),
    location,
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-[52rem] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[12px] text-ink-soft">Saved</p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight font-medium text-ink">
          Businesses you’ve kept.
        </h1>
        <p className="mt-3 max-w-[32rem] text-[15px] leading-6 text-ink-soft">
          Bookmark a place from Discover and it will sit here until you need it.
          This list stays on this device until accounts are connected.
        </p>

        {businesses.length === 0 ? (
          <div className="mt-8 rounded-[8px] border border-dashed border-line px-5 py-10">
            <p className="font-display text-xl text-ink">Nothing saved yet.</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
              Use the bookmark on a business card when you want to come back
              later.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-3">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                distanceKm={business.distanceKm}
                saved={isSaved(business.id)}
                onToggleSaved={() => toggleSaved(business.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
