"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "relative inline-flex min-w-0 select-none items-center justify-center gap-2 text-balance font-display uppercase tracking-[0.14em] transition-[transform,box-shadow,background,color,border-color] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "rounded-2xl border-[3px] border-white/90 bg-gradient-to-b from-primary-glow to-primary text-white [--btn-depth:var(--color-primary-deep)] game-btn-shadow",
        ghost:
          "rounded-full border-2 border-line bg-surface text-fg-soft hover:border-secondary hover:text-secondary-deep",
        danger:
          "rounded-full border-2 border-danger/50 bg-surface text-danger hover:bg-danger/10",
        segment:
          "rounded-full border-2 border-line bg-surface text-fg-soft hover:border-line-2 hover:text-fg",
        segmentActive:
          "rounded-full border-2 border-secondary bg-secondary/10 text-secondary-deep"
      },
      size: {
        sm: "min-h-9 px-3 py-2 text-[10px] sm:text-[11px]",
        md: "min-h-11 px-4 py-2.5 text-[11px] sm:text-xs",
        lg: "min-h-14 px-5 py-3 text-xs sm:px-6 sm:text-sm"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonStyles({ variant, size }), className)}
      {...rest}
    />
  );
});
