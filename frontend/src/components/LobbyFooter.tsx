"use client";

import { Volume2, VolumeX } from "lucide-react";
import { DevCredit } from "@/components/DevCredit";
import { ToastStack } from "@/components/ToastStack";
import type { LastError } from "@/lib/types";

interface LobbyFooterProps {
  disconnected: boolean;
  error: LastError | null;
  notice: string | null;
  muted: boolean;
  onToggleMute: () => void;
}

// Bottom row of the lobby: toasts on the left, version and links centered,
// mute button and dev credit on the right.
export function LobbyFooter({ disconnected, error, notice, muted, onToggleMute }: LobbyFooterProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="min-w-0">
        <ToastStack disconnected={disconnected} error={error} notice={notice} compact={true} />
      </div>
      <p className="hidden items-center gap-1.5 pb-2 text-[11px] font-bold text-white/85 [text-shadow:0_1px_0_rgba(24,73,128,0.5)] sm:flex">
        v0.1.0
        <span aria-hidden="true" className="text-white/50">|</span>
        Chain Reaction
        <span aria-hidden="true" className="text-white/50">|</span>
        <a
          href="https://github.com/Dev22603/chain-reaction"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-white hover:underline"
        >
          GitHub
        </a>
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          className="game-btn-shadow grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-white/90 bg-gradient-to-b from-[#57b0ff] to-secondary text-white [--btn-depth:var(--color-secondary-deep)]"
        >
          {muted ? (
            <VolumeX size={16} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <Volume2 size={16} strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>
        <DevCredit />
      </div>
    </div>
  );
}
