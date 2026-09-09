import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[7.5rem] w-full resize-y rounded-[6px] border border-line bg-card px-3 py-2.5 text-sm leading-6 text-ink placeholder:text-ink-soft/80",
        "transition-colors duration-150 outline-none focus:border-accent focus:ring-0",
        className,
      )}
      {...props}
    />
  );
}
