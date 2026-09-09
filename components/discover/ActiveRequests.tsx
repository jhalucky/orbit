"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusMark } from "@/components/ui/StatusMark";
import { api } from "@/lib/api";
import type { RequestStatus, ServiceRequest } from "@/lib/types";

function toneFor(status: RequestStatus): "accent" | "ink" | "muted" {
  if (status === "PENDING" || status === "READY") return "accent";
  if (status === "IN_PROGRESS" || status === "ACCEPTED") return "ink";
  return "muted";
}

export function ActiveRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    api<ServiceRequest[]>("/requests")
      .then((rows) =>
        setRequests(
          rows
            .filter((row) => !["COMPLETED", "CANCELLED"].includes(row.status))
            .slice(0, 3),
        ),
      )
      .catch(() => setRequests([]));
  }, []);

  return (
    <section aria-labelledby="active-requests-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="active-requests-heading"
          className="font-display text-lg font-medium text-ink"
        >
          Your active requests
        </h2>
        <Link
          href="/requests"
          className="text-[12px] text-ink-soft hover:text-ink"
        >
          View all
        </Link>
      </div>

      {requests.length === 0 ? (
        <p className="mt-4 border-y border-line py-6 text-[13px] text-ink-soft">
          No active requests yet. Message a business to send one.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {requests.map((request) => (
            <li key={request.id}>
              <Link
                href={
                  request.conversationId
                    ? `/messages?c=${request.conversationId}`
                    : "/requests"
                }
                className="block py-3.5 hover:bg-card/80"
              >
                <p className="text-[14px] font-medium text-ink">{request.title}</p>
                <p className="mt-0.5 text-[12px] text-ink-soft">
                  {request.businessName}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink">
                  <StatusMark tone={toneFor(request.status)} />
                  {request.statusLabel}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
