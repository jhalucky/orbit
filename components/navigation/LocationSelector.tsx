"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useCustomer } from "@/lib/customer-context";
import { LOCATIONS } from "@/lib/seed";
import type { LocationOption } from "@/lib/types";

const ICON = { size: 16, strokeWidth: 1.65 };

type Variant = "sidebar" | "compact" | "field";

interface LocationSelectorProps {
  variant?: Variant;
}

export function LocationSelector({
  variant = "sidebar",
}: LocationSelectorProps) {
  const { location, setLocation } = useCustomer();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: LocationOption) {
    setLocation(next);
    setOpen(false);
  }

  const triggerClass =
    variant === "field"
      ? "flex h-12 w-full min-w-[11.5rem] items-center gap-2 border-0 bg-transparent px-3 text-left text-sm text-ink"
      : variant === "compact"
        ? "flex h-8 items-center gap-1.5 rounded-[6px] px-1.5 text-[13px] text-ink-soft hover:bg-card hover:text-ink"
        : "flex h-10 w-full items-center justify-center rounded-[6px] text-[13px] text-ink-soft hover:bg-card hover:text-ink lg:h-9 lg:justify-start lg:gap-2 lg:px-2.5";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        title={`${location.label}, ${location.city}`}
      >
        <MapPin {...ICON} className="shrink-0 text-accent" />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-ink",
            variant === "sidebar" && "hidden lg:inline",
          )}
        >
          {location.label}
        </span>
        <ChevronDown
          {...ICON}
          className={cn(
            "shrink-0 text-ink-soft transition-transform duration-150",
            variant === "sidebar" && "hidden lg:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Choose a neighbourhood"
          className={cn(
            "absolute z-40 overflow-hidden rounded-[8px] border border-line bg-card shadow-[0_8px_24px_rgba(32,29,24,0.08)]",
            variant === "compact"
              ? "top-10 right-0 w-56"
              : variant === "field"
                ? "top-[calc(100%+10px)] right-0 w-56"
                : "top-[calc(100%+6px)] left-0 w-56 lg:w-full",
          )}
        >
          <p className="px-3 pt-2.5 pb-1.5 text-[11px] tracking-[0.12em] text-ink-soft uppercase">
            Neighbourhood
          </p>
          <ul className="pb-1">
            {LOCATIONS.map((option) => {
              const selected = option.id === location.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "flex w-full flex-col items-start px-3 py-2 text-left text-sm",
                      selected ? "bg-accent-soft" : "hover:bg-paper",
                    )}
                    onClick={() => choose(option)}
                  >
                    <span className="text-ink">{option.label}</span>
                    <span className="text-[12px] text-ink-soft">{option.city}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line px-3 py-2.5">
            <p className="text-[12px] text-ink-soft">
              Use my current location
              <span className="mt-0.5 block text-[11px] tracking-wide uppercase">
                Soon
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
