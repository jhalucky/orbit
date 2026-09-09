"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatusMark } from "@/components/ui/StatusMark";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { RequestStatus, ServiceRequest } from "@/lib/types";

function toneFor(status: RequestStatus): "accent" | "ink" | "muted" {
  if (status === "PENDING" || status === "READY") return "accent";
  if (status === "IN_PROGRESS" || status === "ACCEPTED") return "ink";
  return "muted";
}

export default function RequestsPage() {
  const { user } = useApp();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const isProvider = user?.activeRole === "provider";

  useEffect(() => {
    api<ServiceRequest[]>("/requests")
      .then(setRequests)
      .catch(() => setRequests([]));
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-[40rem] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[12px] text-ink-soft">Requests</p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight font-medium text-ink">
          {isProvider ? "Incoming work." : "What you’ve asked for."}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-soft">
          {isProvider
            ? "Accept a request, update it as you work, and mark it ready when it’s done."
            : "Status updates from the business show up here and in the conversation."}
        </p>

        {requests.length === 0 ? (
          <p className="mt-8 border-t border-line pt-6 text-sm text-ink-soft">
            No requests yet. Open a chat and tell a business what you need.
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  href={
                    request.conversationId
                      ? `/messages?c=${request.conversationId}`
                      : "/messages"
                  }
                  className="block py-4 hover:bg-card/60"
                >
                  <p className="font-medium text-ink">{request.title}</p>
                  <p className="mt-1 text-[13px] text-ink-soft">
                    {isProvider ? request.customerName : request.businessName}
                    <span className="mx-1.5 text-line">·</span>
                    {request.categoryLabel}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[12px]">
                    <StatusMark tone={toneFor(request.status)} />
                    {request.statusLabel}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
