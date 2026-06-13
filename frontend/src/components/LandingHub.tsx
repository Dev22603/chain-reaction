"use client";

import { Play, Users, LogIn } from "lucide-react";
import { GameLogo } from "@/components/GameLogo";

interface LandingHubProps {
  connectionReady: boolean;
  onPlayClick: () => void;
  onCreateClick: () => void;
  onJoinClick: () => void;
  onInteract?: () => void;
}

export function LandingHub({
  connectionReady,
  onPlayClick,
  onCreateClick,
  onJoinClick,
  onInteract
}: LandingHubProps) {
  return (
    <div className="relative mx-auto grid w-full max-w-[820px] place-items-center gap-6 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <GameLogo />

      <div className="grid w-full max-w-[420px] justify-items-center gap-4">
        <button
          type="button"
          onClick={() => {
            onInteract?.();
            onPlayClick();
          }}
          disabled={!connectionReady}
          aria-disabled={!connectionReady}
          className="btn-play game-btn-shadow w-full px-8 py-4 text-4xl disabled:cursor-not-allowed disabled:opacity-60 sm:py-5 sm:text-5xl [animation:button-bounce-in_0.5s_cubic-bezier(0.2,0.8,0.4,1)_0.15s_both]"
        >
          <span className="btn-play-chip text-[0.6em]" aria-hidden="true">
            <Play size="1em" strokeWidth={0} fill="currentColor" />
          </span>
          <span className="btn-play-label">{connectionReady ? "PLAY" : "CONNECTING…"}</span>
        </button>

        <div className="grid w-full max-w-[320px] grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              onInteract?.();
              onCreateClick();
            }}
            className="btn-secondary game-btn-shadow px-4 py-2 text-base tracking-wide sm:text-lg"
          >
            <Users size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>Create</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onInteract?.();
              onJoinClick();
            }}
            className="btn-secondary game-btn-shadow px-4 py-2 text-base tracking-wide sm:text-lg"
          >
            <LogIn size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>Join</span>
          </button>
        </div>
      </div>
    </div>
  );
}
