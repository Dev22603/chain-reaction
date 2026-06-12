"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

interface DialogShellProps {
  open: boolean;
  titleId: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: "md" | "lg";
  accent?: "primary" | "secondary";
  variant?: "surface" | "blue";
}

export function DialogShell({
  open,
  titleId,
  onClose,
  children,
  width = "md",
  accent = "secondary",
  variant = "surface"
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
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(24,62,110,0.45)] backdrop-blur-[6px] [animation:overlay-fade_0.2s_ease_both]"
      />

      <div
        className={cn(
          "relative max-h-[calc(100svh-24px)] w-full overflow-y-auto rounded-3xl border-[3px] shadow-panel [animation:dialog-rise_0.45s_cubic-bezier(0.2,0.85,0.4,1)_both]",
          width === "lg" ? "max-w-[520px]" : "max-w-[440px]",
          variant === "blue"
            ? "border-[#cfe8ff] bg-gradient-to-b from-[#2f93ec] to-[#1d6fc6] text-white"
            : cn("bg-surface", accent === "primary" ? "border-primary/70" : "border-secondary/70")
        )}
      >
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}
