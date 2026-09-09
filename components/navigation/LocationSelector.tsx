"use client";

import { ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/app-context";
import { GeolocationError, formatAccuracy, mapsCheckUrl } from "@/lib/geolocation";
import type { LocationOption } from "@/lib/types";

const ICON = { size: 16, strokeWidth: 1.65 };

type Variant = "sidebar" | "compact" | "field";

interface LocationSelectorProps {
  variant?: Variant;
}

export function LocationSelector({
  variant = "sidebar",
}: LocationSelectorProps) {
  const { location, setLocation, neighbourhoods, locateMe, usingDeviceLocation, user } =
    useApp();
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    setLocation(next);
    setOpen(false);
  }

  async function useDeviceLocation() {
    setError(null);
    setLocating(true);
    try {
      await locateMe();
    } catch (err) {
      setError(
        err instanceof GeolocationError
          ? err.message
          : "Couldn’t use your location. Pick a neighbourhood instead.",
      );
    } finally {
      setLocating(false);
    }
  }

  const snappedName = user?.location?.label;
  const locateTitle = locating
    ? "Finding you…"
    : usingDeviceLocation && user?.locationSource === "network"
      ? "Approximate location"
      : usingDeviceLocation && user?.locationSource === "gps"
        ? "Using GPS"
        : usingDeviceLocation
          ? "Using your location"
          : "Use my current location";
  const locateHint = locating
    ? "GPS on a phone, or your network on a computer"
    : usingDeviceLocation && user?.locationSource === "network"
      ? snappedName
        ? `From your network · nearest is ${snappedName}`
        : "From your network · not street-level"
      : usingDeviceLocation && user?.locationSource === "gps"
        ? [
            user.locationAccuracyM != null
              ? formatAccuracy(user.locationAccuracyM)
              : "From your device",
            snappedName ? `nearest is ${snappedName}` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : "GPS on a phone, or your network on a computer";

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
        onClick={() => {
          setOpen((value) => !value);
          setError(null);
        }}
        title={location ? `${location.label}, ${location.city}` : "Choose a neighbourhood"}
      >
        <MapPin {...ICON} className="shrink-0 text-accent" />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-ink",
            variant === "sidebar" && "hidden lg:inline",
          )}
        >
          {location?.label ?? "Location"}
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
            {neighbourhoods.map((option) => {
              const selected = option.id === location?.id && !usingDeviceLocation;
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
          <div className="border-t border-line px-2 py-2">
            <button
              type="button"
              onClick={() => void useDeviceLocation()}
              disabled={locating}
              className={cn(
                "flex w-full items-start gap-2 rounded-[6px] px-2 py-2 text-left text-sm hover:bg-paper disabled:opacity-60",
                usingDeviceLocation && "bg-accent-soft",
              )}
            >
              <LocateFixed {...ICON} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <span className="block text-ink">{locateTitle}</span>
                <span className="mt-0.5 block text-[12px] text-ink-soft">
                  {locateHint}
                </span>
              </span>
            </button>
            {usingDeviceLocation && user?.lat != null && user?.lng != null ? (
              <a
                href={mapsCheckUrl({ lat: user.lat, lng: user.lng })}
                target="_blank"
                rel="noreferrer"
                className="block px-2 pt-1 pb-1 text-[12px] text-ink-soft underline decoration-line underline-offset-2 hover:text-ink"
              >
                Check this point on a map
              </a>
            ) : null}
            {error ? (
              <p className="px-2 pt-1 pb-1 text-[12px] leading-4 text-accent">{error}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
