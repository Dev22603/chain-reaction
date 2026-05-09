"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className="grid gap-2">
      {label ? (
        <span className="font-display text-[10px] uppercase tracking-[0.32em] text-fg-soft">{label}</span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "min-h-12 w-full min-w-0 border border-line bg-bg-soft px-4 py-3 font-mono text-sm text-fg",
          "transition-colors duration-150 placeholder:text-fg-muted",
          "focus:border-cherenkov focus:outline-none focus:shadow-cherenkov",
          className
        )}
        {...rest}
      />
      {hint ? <span className="text-[11px] text-fg-muted">{hint}</span> : null}
    </label>
  );
});
