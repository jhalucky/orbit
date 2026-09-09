"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, CornerUpRight, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { StatusMark } from "@/components/ui/StatusMark";
import { Textarea } from "@/components/ui/Textarea";
import { useApp } from "@/lib/app-context";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDistance, googleDirectionsUrl } from "@/lib/distance";
import {
  formatResponseTime,
  getAvailability,
  hoursWeek,
} from "@/lib/hours";
import type { Business, ConversationSummary, ServiceRequest } from "@/lib/types";

const ICON = { size: 16, strokeWidth: 1.65 };

export function BusinessPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { location, isSaved, toggleSaved, user } = useApp();
  const [business, setBusiness] = useState<Business | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"message" | "request" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (location) {
      params.set("lat", String(location.lat));
      params.set("lng", String(location.lng));
    }
    const query = params.toString();
    api<Business>(`/businesses/${slug}${query ? `?${query}` : ""}`)
      .then((row) => {
        setBusiness(row);
        setMissing(false);
        setLoadError(null);
      })
      .catch((err) => {
        setBusiness(null);
        if (err instanceof ApiError && err.status === 404) {
          setMissing(true);
          setLoadError(null);
          return;
        }
        setMissing(false);
        setLoadError(err instanceof ApiError ? err.message : "Could not load this shop");
      });
  }, [location, slug]);

  const availability = business ? getAvailability(business.hours) : null;
  const ownShop = Boolean(user?.businessId && user.businessId === business?.id);
  const canAsk = user?.activeRole === "customer" && !ownShop;
  const services = business?.services ?? [];

  async function openChat() {
    if (!business) return;
    setPending("message");
    setError(null);
    try {
      const conversation = await api<ConversationSummary>("/conversations", {
        method: "POST",
        body: JSON.stringify({ business_id: business.id }),
      });
      router.push(`/messages?c=${conversation.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open messages");
      setPending(null);
    }
  }

  async function sendRequest() {
    if (!business || title.trim().length < 2) return;
    setPending("request");
    setError(null);
    try {
      const conversation = await api<ConversationSummary>("/conversations", {
        method: "POST",
        body: JSON.stringify({ business_id: business.id }),
      });
      await api<ServiceRequest>("/requests", {
        method: "POST",
        body: JSON.stringify({
          business_id: business.id,
          conversation_id: conversation.id,
          title: title.trim(),
          description: note.trim(),
        }),
      });
      router.push(`/messages?c=${conversation.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the request");
      setPending(null);
    }
  }

  if (missing || loadError) {
    return (
      <div className="mx-auto max-w-[40rem] px-4 py-12 md:px-8">
        <p className="text-[12px] text-ink-soft">Shop</p>
        <h1 className="mt-4 font-display text-[2rem] text-ink">
          {missing ? "This shop isn’t here." : "Couldn’t load this shop."}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          {missing
            ? "It may have moved, or the link is old."
            : loadError}
        </p>
        <Button className="mt-6" href="/" variant="secondary">
          Back to Discover
        </Button>
      </div>
    );
  }

  if (!business || !availability) {
    return (
      <div className="px-4 py-12 text-sm text-ink-soft md:px-8">Loading shop…</div>
    );
  }

  return (
    <div className="mx-auto max-w-[44rem] px-4 py-8 md:px-8 md:py-10">
      <p className="text-[12px] text-ink-soft">
        <Link
          href={user?.activeRole === "provider" ? "/provider" : "/"}
          className="hover:text-ink"
        >
          {user?.activeRole === "provider" ? "Dashboard" : "Discover"}
        </Link>
        <span className="mx-1.5 text-line">/</span>
        {business.neighborhood}
      </p>

      <div className="mt-5 flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] font-display text-lg font-medium",
            business.mark === "fill" && "bg-ink text-paper",
            business.mark === "soft" && "bg-accent-soft text-accent",
            business.mark === "line" && "border border-line bg-card text-ink",
          )}
        >
          {business.monogram}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-[2rem] leading-tight font-medium text-ink">
              {business.name}
            </h1>
            <IconButton
              label={isSaved(business.id) ? "Remove from saved" : "Save business"}
              active={isSaved(business.id)}
              onClick={() => toggleSaved(business.id)}
            >
              <Bookmark
                {...ICON}
                fill={isSaved(business.id) ? "currentColor" : "none"}
              />
            </IconButton>
          </div>
          <p className="mt-1 text-[13px] text-ink-soft">
            {business.categoryLabel}
            <span className="mx-1.5 text-line">·</span>
            {formatDistance(business.distanceKm ?? 0)}
          </p>
          <p
            className={cn(
              "mt-2 flex items-center gap-1.5 text-[13px]",
              availability.isOpen ? "text-ink" : "text-ink-soft",
            )}
          >
            <StatusMark tone={availability.isOpen ? "accent" : "muted"} />
            {availability.label}
          </p>
        </div>
      </div>

      <p className="mt-6 max-w-[38rem] text-[15px] leading-6 text-ink-soft">
        {business.description}
      </p>

      <p className="mt-4 flex items-center gap-1 text-[13px] text-ink">
        <Star size={13} strokeWidth={1.65} className="text-accent" />
        {business.rating.toFixed(1)}
        <span className="text-ink-soft">({business.reviewCount})</span>
        <span className="mx-1.5 text-line">·</span>
        <span className="text-ink-soft">
          {formatResponseTime(business.typicalResponseMinutes)}
        </span>
      </p>

      {ownShop ? (
        <p className="mt-4 rounded-[8px] border border-line bg-card px-3 py-2 text-[13px] text-ink-soft">
          This is your listing.{" "}
          <Link href="/provider/profile" className="text-ink hover:text-accent">
            Edit profile
          </Link>
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">Where</h2>
        <p className="mt-2 text-sm leading-6 text-ink">{business.address}</p>
        <p className="text-[13px] text-ink-soft">{business.neighborhood}</p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          href={googleDirectionsUrl(business.location)}
          external
        >
          <CornerUpRight size={15} strokeWidth={1.65} />
          Directions
        </Button>
      </section>

      {services.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink">Services</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {services.map((service) => (
              <li key={service.id ?? service.name}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start py-3 text-left hover:text-accent"
                  onClick={() => setTitle(service.name)}
                >
                  <span className="text-sm text-ink">{service.name}</span>
                  {service.description ? (
                    <span className="mt-0.5 text-[13px] text-ink-soft">
                      {service.description}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] text-ink-soft">
            Tap a service to use it as the request title.
          </p>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">Hours</h2>
        <ul className="mt-3 text-sm">
          {hoursWeek(business.hours).map((row) => (
            <li
              key={row.day}
              className={cn(
                "flex justify-between gap-4 py-1",
                row.today ? "text-ink" : "text-ink-soft",
              )}
            >
              <span>{row.today ? `${row.name} · today` : row.name}</span>
              <span>{row.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {canAsk ? (
        <section className="mt-10 border-t border-line pt-8">
          <h2 className="font-display text-xl text-ink">Ask them</h2>
          <p className="mt-2 text-[15px] leading-6 text-ink-soft">
            Message the shop, or send a request for a specific job.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What do you need?"
            />
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional details — size, deadline, pickup."
              className="min-h-[5.5rem]"
            />
          </div>
          {error ? <p className="mt-3 text-[13px] text-accent">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={pending !== null || title.trim().length < 2}
              onClick={() => void sendRequest()}
            >
              {pending === "request" ? "Sending…" : "Send request"}
            </Button>
            <Button
              variant="secondary"
              disabled={pending !== null}
              onClick={() => void openChat()}
            >
              {pending === "message" ? "Opening…" : "Message"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
