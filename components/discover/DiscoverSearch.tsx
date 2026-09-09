"use client";

import { Search } from "lucide-react";
import { LocationSelector } from "@/components/navigation/LocationSelector";

interface DiscoverSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function DiscoverSearch({ value, onChange }: DiscoverSearchProps) {
  return (
    <form
      className="mt-8 flex max-w-[42rem] flex-col overflow-hidden rounded-[8px] border border-line bg-card sm:flex-row"
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="relative flex min-w-0 flex-1 items-center">
        <span className="pointer-events-none absolute left-3 text-ink-soft">
          <Search size={16} strokeWidth={1.65} />
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="What do you need help with?"
          className="h-12 w-full border-0 bg-transparent pr-3 pl-10 text-sm text-ink outline-none placeholder:text-ink-soft/85"
          autoComplete="off"
          name="q"
        />
      </label>
      <div className="border-t border-line sm:w-[13.5rem] sm:shrink-0 sm:border-t-0 sm:border-l">
        <LocationSelector variant="field" />
      </div>
    </form>
  );
}
