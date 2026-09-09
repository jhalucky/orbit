"use client";

import { useCustomer } from "@/lib/customer-context";

export function DiscoverHeader() {
  const { location } = useCustomer();

  return (
    <header className="max-w-[40rem]">
      <p className="text-[12px] text-ink-soft">
        Discover
        <span className="mx-1.5 text-line">/</span>
        {location.label}
      </p>
      <h1 className="mt-5 font-display text-[2.15rem] leading-[1.15] font-medium tracking-[-0.02em] text-ink md:text-[2.55rem]">
        Get things done nearby.
      </h1>
      <p className="mt-3 max-w-[32rem] text-[15px] leading-6 text-ink-soft">
        Find a local business, tell them what you need, and get it sorted.
      </p>
    </header>
  );
}
