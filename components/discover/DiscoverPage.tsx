"use client";

import { useMemo, useState } from "react";
import { DiscoverHeader } from "@/components/discover/DiscoverHeader";
import { DiscoverSearch } from "@/components/discover/DiscoverSearch";
import { CategoryNav } from "@/components/discover/CategoryNav";
import { BusinessList } from "@/components/discover/BusinessList";
import { DiscoverPanel } from "@/components/discover/DiscoverPanel";
import { useCustomer } from "@/lib/customer-context";
import { filterBusinesses, sortByDistance } from "@/lib/discover";
import { BUSINESSES } from "@/lib/seed";

export function DiscoverPage() {
  const { location } = useCustomer();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const businesses = useMemo(() => {
    const filtered = filterBusinesses(BUSINESSES, { query, categoryId });
    return sortByDistance(filtered, location);
  }, [categoryId, location, query]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1 px-4 pt-6 pb-4 md:px-8 md:pt-8 md:pb-12">
        <DiscoverHeader />
        <DiscoverSearch value={query} onChange={setQuery} />
        <CategoryNav selectedId={categoryId} onSelect={setCategoryId} />
        <BusinessList businesses={businesses} />
      </div>

      <aside className="border-t border-line px-4 py-8 md:px-8 xl:w-[300px] xl:shrink-0 xl:border-t-0 xl:border-l xl:py-8 xl:pr-8 xl:pl-8">
        <DiscoverPanel />
      </aside>
    </div>
  );
}
