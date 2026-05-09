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
          "bg-reactor text-bg shadow-reactor hover:bg-reactor-glow hover:shadow-[0_0_0_1px_rgba(255,138,76,0.6),0_0_36px_rgba(255,138,76,0.6)]",
        ghost:
          "bg-surface/60 text-fg-soft border border-line hover:border-cherenkov hover:text-cherenkov hover:shadow-cherenkov backdrop-blur",
        danger:
          "bg-surface/60 text-p1 border border-p1/50 hover:bg-p1/10 hover:shadow-[0_0_24px_rgba(255,59,107,0.35)]",
        segment:
          "bg-bg-soft text-fg-soft border border-line hover:border-line-2 hover:text-fg",
        segmentActive:
          "bg-cherenkov/15 text-cherenkov border border-cherenkov shadow-cherenkov"
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
