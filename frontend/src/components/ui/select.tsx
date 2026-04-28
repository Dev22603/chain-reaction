"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, id, children, ...rest },
  ref
) {
  const selectId = id ?? rest.name;
  return (
    <label htmlFor={selectId} className="grid gap-2">
      {label ? (
        <span className="font-display text-[10px] uppercase tracking-[0.32em] text-fg-soft">{label}</span>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-12 w-full appearance-none border border-line bg-bg-soft px-4 pr-10 font-mono text-sm text-fg",
            "transition-colors duration-150 focus:border-cherenkov focus:outline-none focus:shadow-cherenkov",
            className
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted"
        />
      </div>
    </label>
  );
});
