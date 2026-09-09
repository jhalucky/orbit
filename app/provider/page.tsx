"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { StatusMark } from "@/components/ui/StatusMark";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { RequestStatus } from "@/lib/types";

interface Overview {
  businessName: string;
  categoryLabel: string;
  neighborhood: string;
  city: string;
  address: string;
  profileComplete: boolean;
  serviceCount: number;
  newRequests: number;
  inProgress: number;
  ready: number;
  requests: Array<{
    id: string;
    title: string;
    description: string;
    customerName: string;
    status: RequestStatus;
    statusLabel: string;
    updatedAt: string;
    conversationId: string | null;
  }>;
}

const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  READY: "COMPLETED",
};

const NEXT_LABEL: Partial<Record<RequestStatus, string>> = {
  PENDING: "Accept",
  ACCEPTED: "Start work",
  IN_PROGRESS: "Mark ready",
  READY: "Complete",
};

export default function ProviderOverviewPage() {
  const { user } = useApp();
  const [data, setData] = useState<Overview | null>(null);

  async function load() {
    const next = await api<Overview>("/provider/overview");
    setData(next);
  }

  useEffect(() => {
    let cancelled = false;
    api<Overview>("/provider/overview")
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function advance(id: string, status: RequestStatus) {
    const next = NEXT_STATUS[status];
    if (!next) return;
    await api(`/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await load();
  }

  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <div className="mx-auto max-w-[52rem] px-4 py-8 md:px-8 md:py-10">
        <h1 className="font-display text-[2rem] leading-tight font-medium text-ink">
          {hello}, {data?.businessName ?? user?.businessName ?? "there"}.
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Today’s work from people nearby.
        </p>

        {data && !data.profileComplete ? (
          <div className="mt-6 rounded-[8px] border border-line bg-card px-4 py-4">
            <p className="font-medium text-ink">Finish your shop listing</p>
            <p className="mt-1 text-[13px] leading-5 text-ink-soft">
              Add where you are, what you do, and the services you take so
              customers can find you on Discover.
            </p>
            <Button size="sm" className="mt-3" href="/provider/setup">
              Complete profile
            </Button>
          </div>
        ) : null}

        <div className="mt-8 rounded-[8px] border border-line bg-card px-4 py-4">
          <p className="text-[12px] text-ink-soft">Your shop</p>
          <p className="mt-1 font-medium text-ink">
            {data?.businessName ?? user?.businessName}
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">
            {[data?.categoryLabel, data?.neighborhood, data?.city]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {data?.address ? (
            <p className="mt-1 text-[13px] text-ink-soft">{data.address}</p>
          ) : null}
          <p className="mt-1 text-[13px] text-ink-soft">
            {data?.serviceCount ?? 0}{" "}
            {(data?.serviceCount ?? 0) === 1 ? "service" : "services"} listed
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" href="/provider/profile">
              Edit profile
            </Button>
            <Button size="sm" variant="secondary" href="/provider/services">
              Edit services
            </Button>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="New requests" value={data?.newRequests ?? 0} />
          <Stat label="In progress" value={data?.inProgress ?? 0} />
          <Stat label="Ready" value={data?.ready ?? 0} />
        </dl>

        <h2 className="mt-10 font-display text-xl text-ink">Today’s requests</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {(data?.requests ?? []).map((request) => (
            <li key={request.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{request.title}</p>
                  <p className="mt-1 text-[13px] text-ink-soft">
                    {request.customerName}
                    <span className="mx-1.5 text-line">·</span>
                    {request.description}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[12px]">
                    <StatusMark
                      tone={
                        request.status === "PENDING" || request.status === "READY"
                          ? "accent"
                          : "ink"
                      }
                    />
                    {request.statusLabel}
                  </p>
                </div>
                <div className="flex gap-2">
                  {request.conversationId ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      href={`/messages?c=${request.conversationId}`}
                    >
                      Reply
                    </Button>
                  ) : null}
                  {NEXT_LABEL[request.status] ? (
                    <Button
                      size="sm"
                      onClick={() => void advance(request.id, request.status)}
                    >
                      {NEXT_LABEL[request.status]}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {data && data.requests.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No open requests right now.</p>
        ) : null}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-line bg-card px-3 py-3">
      <dt className="text-[12px] text-ink-soft">{label}</dt>
      <dd className="mt-1 font-display text-2xl text-ink">{value}</dd>
    </div>
  );
}
