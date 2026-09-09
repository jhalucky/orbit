import { AppShell } from "@/components/layout/AppShell";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  body: string;
}

export function PlaceholderPage({ eyebrow, title, body }: PlaceholderPageProps) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[34rem] px-4 py-12 md:px-8 md:py-16">
        <p className="text-[12px] text-ink-soft">{eyebrow}</p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight font-medium text-ink">
          {title}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-soft">{body}</p>
      </div>
    </AppShell>
  );
}
