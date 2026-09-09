"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Category, DayHours, LocationOption, ProviderService } from "@/lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const ICON = { size: 15, strokeWidth: 1.65 };

export interface ShopDraft {
  name: string;
  categoryId: string;
  locationId: string;
  address: string;
  description: string;
  typicalResponseMinutes: number;
  hours: DayHours[];
  services: ProviderService[];
}

export function emptyHours(): DayHours[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day: day as DayHours["day"],
    open: "09:00",
    close: "19:00",
    closed: day === 0,
  }));
}

export function emptyShopDraft(): ShopDraft {
  return {
    name: "",
    categoryId: "",
    locationId: "",
    address: "",
    description: "",
    typicalResponseMinutes: 30,
    hours: emptyHours(),
    services: [{ name: "", description: "" }],
  };
}

interface ShopFormProps {
  value: ShopDraft;
  onChange: (next: ShopDraft) => void;
  categories: Category[];
  neighbourhoods: LocationOption[];
  showHours?: boolean;
}

export function ShopForm({
  value,
  onChange,
  categories,
  neighbourhoods,
  showHours = true,
}: ShopFormProps) {
  function patch(partial: Partial<ShopDraft>) {
    onChange({ ...value, ...partial });
  }

  function updateService(index: number, partial: Partial<ProviderService>) {
    patch({
      services: value.services.map((service, i) =>
        i === index ? { ...service, ...partial } : service,
      ),
    });
  }

  const selectedPlace = neighbourhoods.find((place) => place.id === value.locationId);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Business name">
        <Input
          value={value.name}
          onChange={(event) => patch({ name: event.target.value })}
          placeholder="Corner Copy & More"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What kind of work">
          <Select
            value={value.categoryId}
            onChange={(event) => patch({ categoryId: event.target.value })}
            required
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Neighbourhood">
          <Select
            value={value.locationId}
            onChange={(event) => patch({ locationId: event.target.value })}
            required
          >
            <option value="">Choose an area</option>
            {neighbourhoods.map((place) => (
              <option key={place.id} value={place.id}>
                {place.label}, {place.city}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Street address">
        <Input
          value={value.address}
          onChange={(event) => patch({ address: event.target.value })}
          placeholder="C-12, Okhla Industrial Area Phase 1"
          required
        />
        {selectedPlace ? (
          <p className="mt-1.5 text-[12px] text-ink-soft">
            Customers will see you in {selectedPlace.label}, {selectedPlace.city}.
          </p>
        ) : null}
      </Field>

      <Field label="What do you do">
        <Textarea
          value={value.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="A short description customers will read on Discover."
          required
          minLength={12}
        />
      </Field>

      <div>
        <p className="mb-1.5 text-[12px] text-ink-soft">Services you offer</p>
        <ul className="flex flex-col gap-2">
          {value.services.map((service, index) => (
            <li key={index} className="flex gap-2">
              <Input
                value={service.name}
                onChange={(event) => updateService(index, { name: event.target.value })}
                placeholder={index === 0 ? "Colour print" : "Another service"}
                required={index === 0}
              />
              {value.services.length > 1 ? (
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] border border-line text-ink-soft hover:text-ink"
                  onClick={() =>
                    patch({
                      services: value.services.filter((_, i) => i !== index),
                    })
                  }
                  aria-label="Remove service"
                >
                  <Trash2 {...ICON} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
          onClick={() =>
            patch({
              services: [...value.services, { name: "", description: "" }],
            })
          }
        >
          <Plus {...ICON} />
          Add a service
        </button>
      </div>

      {showHours ? (
        <div>
          <p className="mb-1.5 text-[12px] text-ink-soft">Hours</p>
          <ul className="divide-y divide-line rounded-[8px] border border-line bg-card">
            {value.hours.map((entry, index) => (
              <li key={entry.day} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className="w-10 text-[13px] text-ink">{DAYS[entry.day]}</span>
                <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={!entry.closed}
                    onChange={(event) => {
                      const hours = value.hours.map((item, i) =>
                        i === index ? { ...item, closed: !event.target.checked } : item,
                      );
                      patch({ hours });
                    }}
                  />
                  Open
                </label>
                {!entry.closed ? (
                  <>
                    <input
                      type="time"
                      value={entry.open}
                      className="h-8 rounded-[6px] border border-line bg-paper px-2 text-[13px] text-ink"
                      onChange={(event) => {
                        const hours = value.hours.map((item, i) =>
                          i === index ? { ...item, open: event.target.value } : item,
                        );
                        patch({ hours });
                      }}
                    />
                    <span className="text-[12px] text-ink-soft">to</span>
                    <input
                      type="time"
                      value={entry.close}
                      className="h-8 rounded-[6px] border border-line bg-paper px-2 text-[13px] text-ink"
                      onChange={(event) => {
                        const hours = value.hours.map((item, i) =>
                          i === index ? { ...item, close: event.target.value } : item,
                        );
                        patch({ hours });
                      }}
                    />
                  </>
                ) : (
                  <span className="text-[12px] text-ink-soft">Closed</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="h-11 w-full rounded-[6px] border border-line bg-card px-3 text-sm text-ink outline-none focus:border-accent"
      {...props}
    />
  );
}

export function shopPayload(draft: ShopDraft) {
  return {
    name: draft.name.trim(),
    category_id: draft.categoryId,
    location_id: draft.locationId,
    address: draft.address.trim(),
    description: draft.description.trim(),
    typical_response_minutes: draft.typicalResponseMinutes,
    hours: draft.hours,
    services: draft.services
      .map((service) => ({
        name: service.name.trim(),
        description: service.description.trim(),
      }))
      .filter((service) => service.name.length >= 2),
  };
}

export function shopFormValid(draft: ShopDraft): boolean {
  return (
    draft.name.trim().length >= 2 &&
    Boolean(draft.categoryId) &&
    Boolean(draft.locationId) &&
    draft.address.trim().length >= 4 &&
    draft.description.trim().length >= 12 &&
    draft.services.some((service) => service.name.trim().length >= 2)
  );
}
