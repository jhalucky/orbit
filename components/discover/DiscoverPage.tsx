"use client";

import { useEffect, useState } from "react";
import { DiscoverHeader } from "@/components/discover/DiscoverHeader";
import { DiscoverSearch } from "@/components/discover/DiscoverSearch";
import { CategoryNav } from "@/components/discover/CategoryNav";
import { BusinessList } from "@/components/discover/BusinessList";
import { DiscoverPanel } from "@/components/discover/DiscoverPanel";
import { useApp } from "@/lib/app-context";
import { api } from "@/lib/api";
import type { Business, Category } from "@/lib/types";

export function DiscoverPage() {
  const { location } = useApp();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Category[]>("/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!location) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (categoryId) params.set("categoryId", categoryId);
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    let cancelled = false;
    api<Business[]>(`/businesses?${params.toString()}`)
      .then((rows) => {
        if (!cancelled) {
          setError(null);
          setBusinesses(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBusinesses([]);
          setError("Could not load businesses from the API.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, location, query]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1 px-4 pt-6 pb-4 md:px-8 md:pt-8 md:pb-12">
        <DiscoverHeader />
        <DiscoverSearch value={query} onChange={setQuery} />
        <CategoryNav
          categories={categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />
        {error ? (
          <p className="mt-6 text-sm text-accent">{error}</p>
        ) : (
          <BusinessList businesses={businesses} />
        )}
      </div>

      <aside className="border-t border-line px-4 py-8 md:px-8 xl:w-[300px] xl:shrink-0 xl:border-t-0 xl:border-l xl:py-8 xl:pr-8 xl:pl-8">
        <DiscoverPanel />
      </aside>
    </div>
  );
}
