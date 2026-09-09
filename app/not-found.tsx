import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[34rem] px-4 py-16 md:px-8">
        <p className="text-[12px] text-ink-soft">404</p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight font-medium text-ink">
          That page isn’t on Orbit.
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-soft">
          Head back to Discover and look for a business nearby.
        </p>
        <p className="mt-6">
          <Link href="/" className="text-sm text-accent hover:text-accent-dark">
            Go to Discover
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
