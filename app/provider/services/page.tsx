"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import type { ProviderBusiness, ProviderService } from "@/lib/types";

const ICON = { size: 15, strokeWidth: 1.65 };

export default function ProviderServicesPage() {
  const { refreshUser } = useApp();
  const [services, setServices] = useState<ProviderService[]>([
    { name: "", description: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<ProviderBusiness>("/provider/business")
      .then((shop) => {
        setServices(
          shop.services.length ? shop.services : [{ name: "", description: "" }],
        );
      })
      .catch(() => undefined);
  }, []);

  async function save() {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const payload = services
        .map((service) => ({
          name: service.name.trim(),
          description: service.description.trim(),
        }))
        .filter((service) => service.name.length >= 2);
      if (payload.length === 0) {
        setError("Add at least one service.");
        setPending(false);
        return;
      }
      await api("/provider/business", {
        method: "PATCH",
        body: JSON.stringify({ services: payload }),
      });
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[36rem] px-4 py-8 md:px-8 md:py-10">
        <p className="text-[12px] text-ink-soft">Services</p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight font-medium text-ink">
          The work you take.
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-soft">
          Customers pick from this list when they message you. Keep it short and
          specific.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {services.map((service, index) => (
            <li
              key={index}
              className="rounded-[8px] border border-line bg-card p-3"
            >
              <div className="flex gap-2">
                <Input
                  value={service.name}
                  placeholder="Screen replacement"
                  onChange={(event) =>
                    setServices((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                />
                {services.length > 1 ? (
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] border border-line text-ink-soft hover:text-ink"
                    onClick={() =>
                      setServices((current) => current.filter((_, i) => i !== index))
                    }
                    aria-label="Remove service"
                  >
                    <Trash2 {...ICON} />
                  </button>
                ) : null}
              </div>
              <Input
                className="mt-2"
                value={service.description}
                placeholder="Optional note — same day if the part is in"
                onChange={(event) =>
                  setServices((current) =>
                    current.map((item, i) =>
                      i === index
                        ? { ...item, description: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
          onClick={() =>
            setServices((current) => [...current, { name: "", description: "" }])
          }
        >
          <Plus {...ICON} />
          Add a service
        </button>

        {error ? <p className="mt-4 text-[13px] text-accent">{error}</p> : null}
        {saved ? (
          <p className="mt-4 text-[13px] text-ink-soft">Services saved.</p>
        ) : null}

        <Button className="mt-6" disabled={pending} onClick={() => void save()}>
          {pending ? "Saving…" : "Save services"}
        </Button>
      </div>
    </AppShell>
  );
}
