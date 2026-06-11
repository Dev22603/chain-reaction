import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative isolate overflow-hidden rounded-3xl border-[3px] border-white/90 bg-surface shadow-panel",
          className
        )}
        {...rest}
      />
    );
  }
);

export function CardCorners() {
  return null;
}

export function CardEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] uppercase tracking-[0.4em] text-secondary-deep/80">
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
