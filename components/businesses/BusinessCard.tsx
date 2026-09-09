"use client";

import Link from "next/link";
import { Bookmark, CornerUpRight, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { StatusMark } from "@/components/ui/StatusMark";
import { cn } from "@/lib/cn";
import { formatDistance, googleDirectionsUrl } from "@/lib/distance";
import { formatResponseTime, getAvailability } from "@/lib/hours";
import type { Business } from "@/lib/types";

const ICON = { size: 15, strokeWidth: 1.65 };

interface BusinessCardProps {
  business: Business;
  distanceKm: number;
  saved: boolean;
  onToggleSaved: () => void;
  featured?: boolean;
}

export function BusinessCard({
  business,
  distanceKm,
  saved,
  onToggleSaved,
  featured = false,
}: BusinessCardProps) {
  const availability = getAvailability(business.hours);
  const tags = featured ? business.tags : business.tags.slice(0, 3);

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-[8px] border border-line bg-card",
        featured ? "gap-4 p-5 md:flex-row md:items-start md:gap-6 md:p-6" : "p-4",
        !availability.isOpen && "bg-card/70",
      )}
    >
      <div className={cn("flex gap-3", featured && "md:w-[3.25rem] md:shrink-0")}>
        <Link
          href={`/business/${business.slug}`}
          className="shrink-0"
          aria-label={`${business.name} shop`}
        >
          <Monogram
            letters={business.monogram}
            mark={business.mark}
            large={featured}
          />
        </Link>
        {featured ? (
          <div className="min-w-0 pr-8 md:hidden">
            <CardHeading business={business} distanceKm={distanceKm} featured />
          </div>
        ) : (
          <div className="min-w-0 flex-1 pr-8">
            <CardHeading business={business} distanceKm={distanceKm} />
          </div>
        )}
      </div>

      <div className={cn("min-w-0 flex-1", featured && "md:pt-0.5")}>
        {featured ? (
          <div className="hidden md:block">
            <CardHeading business={business} distanceKm={distanceKm} featured />
          </div>
        ) : null}

        <p
          className={cn(
            "text-ink-soft",
            featured ? "mt-2 max-w-[38rem] text-[15px] leading-6" : "mt-3 text-[13px] leading-5",
          )}
        >
          {business.description}
        </p>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-[4px] border border-line px-1.5 py-0.5 text-[11px] text-ink-soft"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div
          className={cn(
            "mt-4 flex flex-wrap items-center gap-x-3 gap-y-2",
            featured && "md:mt-5",
          )}
        >
          <p className="flex items-center gap-1 text-[12px] text-ink">
            <Star size={12} strokeWidth={1.65} className="text-accent" />
            <span>{business.rating.toFixed(1)}</span>
            <span className="text-ink-soft">({business.reviewCount})</span>
          </p>
          <p className="text-[12px] text-ink-soft">
            {formatResponseTime(business.typicalResponseMinutes)}
          </p>
        </div>

        <div className={cn("mt-4 flex flex-wrap items-center gap-2", featured && "md:mt-5")}>
          <Button size="sm" href={`/business/${business.slug}`}>
            View shop
          </Button>
          <Button size="sm" variant="secondary" href={`/messages?business=${business.id}`}>
            Message
          </Button>
          <Button
            size="sm"
            variant="secondary"
            href={googleDirectionsUrl(business.location)}
            external
          >
            <CornerUpRight {...ICON} />
            Directions
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "absolute top-3 right-3 flex items-center gap-2",
          featured && "md:static md:ml-auto md:flex-col md:items-end md:gap-3",
        )}
      >
        {featured ? (
          <span
            className={cn(
              "hidden items-center gap-1.5 text-[12px] md:inline-flex",
              availability.isOpen ? "text-ink" : "text-ink-soft",
            )}
          >
            <StatusMark tone={availability.isOpen ? "accent" : "muted"} />
            {availability.label}
          </span>
        ) : null}
        <IconButton
          label={saved ? "Remove from saved" : "Save business"}
          active={saved}
          onClick={onToggleSaved}
        >
          <Bookmark {...ICON} fill={saved ? "currentColor" : "none"} />
        </IconButton>
      </div>
    </article>
  );
}

function CardHeading({
  business,
  distanceKm,
  featured = false,
}: {
  business: Business;
  distanceKm: number;
  featured?: boolean;
}) {
  const availability = getAvailability(business.hours);

  return (
    <header>
      <h3
        className={cn(
          "text-ink",
          featured
            ? "font-display text-[1.35rem] font-medium leading-tight"
            : "text-[15px] font-medium leading-snug",
        )}
      >
        <Link href={`/business/${business.slug}`} className="hover:text-accent">
          {business.name}
        </Link>
      </h3>
      <p className="mt-0.5 text-[12px] text-ink-soft">
        {business.neighborhood}
        <span className="mx-1.5 text-line">·</span>
        {business.categoryLabel}
        <span className="mx-1.5 text-line">·</span>
        {formatDistance(distanceKm)}
      </p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 text-[12px]",
          availability.isOpen ? "text-ink" : "text-ink-soft",
          featured && "md:hidden",
        )}
      >
        <StatusMark tone={availability.isOpen ? "accent" : "muted"} />
        {availability.label}
      </p>
    </header>
  );
}

function Monogram({
  letters,
  mark,
  large,
}: {
  letters: string;
  mark: Business["mark"];
  large?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[8px] font-display font-medium",
        large ? "h-12 w-12 text-base" : "h-10 w-10 text-sm",
        mark === "fill" && "bg-ink text-paper",
        mark === "soft" && "bg-accent-soft text-accent",
        mark === "line" && "border border-line bg-paper text-ink",
      )}
    >
      {letters}
    </span>
  );
}
