"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

interface DialogShellProps {
  open: boolean;
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: "md" | "lg";
  accent?: "reactor" | "cherenkov";
}

export function DialogShell({
  open,
  titleId,
  onClose,
  children,
  width = "md",
  accent = "cherenkov"
}: DialogShellProps) {
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center px-2 py-3 sm:px-6 sm:py-6"
    >
      {/* <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-bg-soft/60 backdrop-blur-sm [animation:overlay-fade_0.2s_ease-out_both]"
        tabIndex={-1}
      /> */}

      <div
        className={cn(
          "relative w-full rounded-2xl border-2 bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.55)] [animation:dialog-rise_0.45s_cubic-bezier(0.2,0.85,0.4,1)_both]",
          width === "lg" ? "max-w-[520px]" : "max-w-[440px]",
          accent === "reactor" ? "border-reactor/60" : "border-cherenkov/60"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px",
            accent === "reactor"
              ? "bg-gradient-to-r from-transparent via-reactor to-transparent"
              : "bg-gradient-to-r from-transparent via-cherenkov to-transparent"
          )}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line-2 to-transparent"
        />
        <span aria-hidden className="pointer-events-none absolute left-2 top-2 z-10 h-3 w-3 border-l border-t border-current/40" />
        <span aria-hidden className="pointer-events-none absolute right-2 top-2 z-10 h-3 w-3 border-r border-t border-current/40" />
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 z-10 h-3 w-3 border-b border-l border-current/40" />
        <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 z-10 h-3 w-3 border-b border-r border-current/40" />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 paper-grain opacity-30 mix-blend-screen"
        />

        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}
