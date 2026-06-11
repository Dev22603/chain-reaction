"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, id, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  const hintId = `${inputId}-hint`;
  return (
    <div className="grid gap-2">
      {label ? (
        <label htmlFor={inputId} className="font-display text-[10px] uppercase tracking-[0.32em] text-fg-soft">{label}</label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          "min-h-12 w-full min-w-0 rounded-xl border-2 border-line bg-surface px-4 py-3 text-sm font-semibold text-fg",
          "transition-colors duration-150 placeholder:text-fg-muted",
          "focus:border-secondary focus:outline-none",
          className
        )}
        {...rest}
      />
      {hint ? <span id={hintId} className="text-[11px] text-fg-muted">{hint}</span> : null}
    </div>
  );
});
