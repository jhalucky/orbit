import Link from "next/link";
import { cn } from "@/lib/cn";
import { OrbitMark } from "./OrbitMark";

interface WordmarkProps {
  compact?: boolean;
  className?: string;
}

export function Wordmark({ compact = false, className }: WordmarkProps) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 text-ink", className)}
      aria-label="Orbit, go to Discover"
    >
      <OrbitMark className="h-7 w-7 shrink-0" />
      {compact ? null : (
        <span className="font-display text-[1.05rem] font-medium tracking-[0.16em]">
          ORBIT
        </span>
      )}
    </Link>
  );
}
