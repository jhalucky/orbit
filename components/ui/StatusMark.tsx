import { cn } from "@/lib/cn";

interface StatusMarkProps {
  tone?: "accent" | "ink" | "muted";
  className?: string;
}

export function StatusMark({ tone = "muted", className }: StatusMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-[2px]",
        tone === "accent" && "bg-accent",
        tone === "ink" && "bg-ink",
        tone === "muted" && "bg-ink-soft/40",
        className,
      )}
    />
  );
}
