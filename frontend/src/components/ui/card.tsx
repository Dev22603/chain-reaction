import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative isolate overflow-hidden border border-line bg-surface/70 backdrop-blur-md shadow-panel",
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cherenkov/60 before:to-transparent",
          "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-reactor/40 after:to-transparent",
          className
        )}
        {...rest}
      />
    );
  }
);

export function CardCorners() {
  return (
    <>
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-cherenkov/60" />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-cherenkov/60" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-reactor/60" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-reactor/60" />
    </>
  );
}

export function CardEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] uppercase tracking-[0.4em] text-cherenkov/80">
      {children}
    </p>
  );
}

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ children, className, ...rest }: CardTitleProps) {
  return (
    <h1
      className={cn("font-display text-3xl uppercase tracking-[0.05em] text-fg sm:text-5xl", className)}
      {...rest}
    >
      {children}
    </h1>
  );
}
