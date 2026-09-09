"use client";

import { BusinessCard } from "@/components/businesses/BusinessCard";
import { useApp } from "@/lib/app-context";
import { getAvailability } from "@/lib/hours";
import type { Business } from "@/lib/types";

interface BusinessListProps {
  businesses: Business[];
}

export function BusinessList({ businesses }: BusinessListProps) {
  const { isSaved, toggleSaved, location } = useApp();

  if (businesses.length === 0) {
    return (
      <div className="mt-6 rounded-[8px] border border-dashed border-line px-5 py-10">
        <p className="font-display text-xl text-ink">Nothing nearby matches that.</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
          Try another word, or pick a category. You&apos;re looking around{" "}
          {location?.label ?? "this area"}.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = businesses;
  const openCount = businesses.filter(
    (business) => getAvailability(business.hours).isOpen,
  ).length;

  return (
    <section className="mt-10" aria-labelledby="around-you-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="around-you-heading"
            className="font-display text-[1.35rem] font-medium text-ink"
          >
            Around you
          </h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            {businesses.length}{" "}
            {businesses.length === 1 ? "business" : "businesses"} near{" "}
            {location?.label ?? "you"}
          </p>
        </div>
        <p className="hidden text-[12px] text-ink-soft sm:block">
          {openCount} open now
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <div className="md:col-span-2">
          <BusinessCard
            business={featured}
            distanceKm={featured.distanceKm ?? 0}
            saved={isSaved(featured.id)}
            onToggleSaved={() => toggleSaved(featured.id)}
            featured
          />
        </div>
        {rest.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            distanceKm={business.distanceKm ?? 0}
            saved={isSaved(business.id)}
            onToggleSaved={() => toggleSaved(business.id)}
          />
        ))}
      </div>
    </section>
  );
}
