"use client";

import { Ban } from "lucide-react";

// Placeholder, no purchase flow is wired up yet.
export function RemoveAdsButton() {
  return (
    <button
      type="button"
      title="Coming soon"
      className="btn-accent game-btn-shadow inline-flex h-10 items-center gap-2 px-3.5 text-xs sm:text-sm"
    >
      <Ban size={14} strokeWidth={3} aria-hidden="true" />
      <span>Remove Ads!</span>
    </button>
  );
}
