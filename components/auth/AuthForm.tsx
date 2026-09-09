"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Wordmark } from "@/components/navigation/Wordmark";
import {
  ShopForm,
  emptyShopDraft,
  shopFormValid,
  shopPayload,
  type ShopDraft,
} from "@/components/provider/ShopForm";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/cn";
import type { Category, LocationOption, SessionUser } from "@/lib/types";

type Intent = "customer" | "provider";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { refreshUser } = useApp();
  const [intent, setIntent] = useState<Intent>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [shopStep, setShopStep] = useState(false);
  const [draft, setDraft] = useState<ShopDraft>(emptyShopDraft());
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<LocationOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [google, setGoogle] = useState(false);

  useEffect(() => {
    api<{ google: boolean }>("/auth/features", { skipAuthRedirect: true })
      .then((data) => setGoogle(data.google))
      .catch(() => setGoogle(false));
    api<Category[]>("/categories", { skipAuthRedirect: true })
      .then(setCategories)
      .catch(() => setCategories([]));
    api<LocationOption[]>("/neighbourhoods", { skipAuthRedirect: true })
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);

  function afterAuth(user: SessionUser) {
    if (user.activeRole === "provider") {
      router.replace(user.shopComplete ? "/provider" : "/provider/setup");
      return;
    }
    router.replace("/");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "register" && intent === "provider" && !shopStep) {
      if (businessName.trim().length < 2) {
        setError("Give your business a name.");
        return;
      }
      setDraft((current) => ({ ...current, name: businessName.trim() }));
      setShopStep(true);
      setError(null);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const shop = shopPayload(draft);
      const body =
        mode === "login"
          ? { email, password, intent }
          : {
              email,
              password,
              name,
              intent,
              business_name: intent === "provider" ? shop.name || businessName : undefined,
              category_id: intent === "provider" ? shop.category_id : undefined,
              location_id: intent === "provider" ? shop.location_id : undefined,
              address: intent === "provider" ? shop.address : undefined,
              description: intent === "provider" ? shop.description : undefined,
              services: intent === "provider" ? shop.services : undefined,
            };
      const user = await api<SessionUser>(path, {
        method: "POST",
        body: JSON.stringify(body),
        skipAuthRedirect: true,
      });
      await refreshUser();
      afterAuth(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-4 py-10">
      <div className={cn("mx-auto w-full", shopStep ? "max-w-[32rem]" : "max-w-[26rem]")}>
        <Wordmark />
        <p className="mt-8 font-display text-[2rem] leading-tight font-medium text-ink">
          {mode === "login"
            ? "Welcome back."
            : shopStep
              ? "Your shop."
              : "Join Orbit."}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {mode === "login"
            ? "Sign in as a customer or as a business."
            : shopStep
              ? "Where you work, and what people can ask you for."
              : "Find help nearby, or receive work from people around you."}
        </p>

        <div className="mt-6 flex border-b border-line">
          <IntentTab
            label="I need a service"
            active={intent === "customer"}
            onClick={() => {
              setIntent("customer");
              setShopStep(false);
            }}
          />
          <IntentTab
            label="I run a business"
            active={intent === "provider"}
            onClick={() => {
              setIntent("provider");
              setShopStep(false);
            }}
          />
        </div>

        <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
          {!shopStep && mode === "register" ? (
            <Input
              name="name"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          ) : null}
          {!shopStep ? (
            <>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </>
          ) : null}
          {mode === "register" && intent === "provider" && shopStep ? (
            <ShopForm
              value={draft}
              onChange={setDraft}
              categories={categories}
              neighbourhoods={places}
              showHours={false}
            />
          ) : null}
          {mode === "register" && intent === "provider" && !shopStep ? (
            <Input
              name="business"
              placeholder="Business name"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              required
            />
          ) : null}

          {error ? <p className="text-[13px] text-accent">{error}</p> : null}

          <Button
            type="submit"
            disabled={
              pending ||
              (mode === "register" &&
                intent === "provider" &&
                shopStep &&
                !shopFormValid(draft))
            }
            className="mt-1 w-full"
          >
            {pending
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : intent === "provider" && !shopStep
                  ? "Continue"
                  : mode === "register" && intent === "provider"
                    ? "Create shop"
                    : "Create account"}
          </Button>
          {mode === "register" && intent === "provider" && shopStep ? (
            <button
              type="button"
              className="text-[13px] text-ink-soft hover:text-ink"
              onClick={() => setShopStep(false)}
            >
              Back
            </button>
          ) : null}
        </form>

        {google ? (
          <p className="mt-5 text-center text-[13px] text-ink-soft">
            <a href="/orbit-api/auth/google" className="text-ink hover:text-accent">
              Continue with Google
            </a>
          </p>
        ) : (
          <p className="mt-5 text-[12px] leading-5 text-ink-soft">
            Google sign-in is ready in the API. Add a client ID and secret to
            enable it.
          </p>
        )}

        <p className="mt-6 text-[13px] text-ink-soft">
          {mode === "login" ? (
            <>
              New here?{" "}
              <a href="/register" className="text-ink hover:text-accent">
                Create an account
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a href="/login" className="text-ink hover:text-accent">
                Sign in
              </a>
            </>
          )}
        </p>

        {mode === "login" ? (
          <div className="mt-8 border-t border-line pt-5 text-[12px] leading-5 text-ink-soft">
            <p>Demo accounts, password <span className="text-ink">orbit-dev</span></p>
            <p className="mt-1">Customer — ananya@example.com</p>
            <p>Corner Copy — ravi@example.com</p>
            <p>Circuit Bench — meera@example.com</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IntentTab({
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
        "-mb-px flex-1 py-2 text-[13px]",
        active ? "border-b-2 border-accent text-ink" : "border-b-2 border-transparent text-ink-soft",
      )}
    >
      {label}
    </button>
  );
}
