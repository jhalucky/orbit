"use client";

import type { Category } from "@/lib/types";
import { cn } from "@/lib/cn";

interface CategoryNavProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryNav({
  categories,
  selectedId,
  onSelect,
}: CategoryNavProps) {
  return (
    <nav aria-label="Service categories" className="mt-6 border-b border-line">
      <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
        <li>
          <CategoryButton
            label="All"
            active={selectedId === null}
            onClick={() => onSelect(null)}
          />
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryButton
              label={category.label}
              active={selectedId === category.id}
              onClick={() => onSelect(category.id)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative -mb-px whitespace-nowrap px-2.5 py-2 text-[13px] transition-colors duration-150",
        active
          ? "border-b-2 border-accent text-ink"
          : "border-b-2 border-transparent text-ink-soft hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
