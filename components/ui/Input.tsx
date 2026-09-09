import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <label className={cn("relative flex min-w-0 flex-1 items-center", className)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3 text-ink-soft">
          {icon}
        </span>
      ) : null}
      <input
        className={cn(
          "h-11 w-full rounded-[6px] border border-line bg-card px-3 text-sm text-ink placeholder:text-ink-soft/80",
          "transition-colors duration-150 outline-none",
          "focus:border-accent focus:ring-0",
          icon ? "pl-10" : undefined,
        )}
        {...props}
      />
    </label>
  );
}
