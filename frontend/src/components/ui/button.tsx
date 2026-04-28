"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "relative inline-flex select-none items-center justify-center gap-2 font-display uppercase tracking-[0.18em] transition-[transform,box-shadow,background,color] duration-200 ease-out disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px",
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
        sm: "h-9 px-3 text-[11px]",
        md: "h-11 px-4 text-xs",
        lg: "h-14 px-6 text-sm"
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
