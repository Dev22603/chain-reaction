import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-line bg-bg-soft px-2 py-1 font-display text-[10px] uppercase tracking-[0.3em] text-fg-soft",
        className
      )}
      {...rest}
    />
  );
}
