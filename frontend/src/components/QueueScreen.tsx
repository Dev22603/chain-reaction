"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PLAYER_COLORS } from "@/lib/colors";
import { presetForGrid } from "@/lib/presets";
import type { QueuedInfo } from "@/lib/types";

interface QueueScreenProps {
  info: QueuedInfo | null;
  code?: string | null;
  onCancel: () => void;
}

export function QueueScreen({ info, code, onCancel }: QueueScreenProps) {
  const position = info?.position ?? 1;
  const max = info?.maxPlayers ?? 0;
  const isPrivate = !!code;

  if (isPrivate && code) {
    return (
      <PrivateQueueScreen
        code={code}
        position={position}
        max={max}
        onCancel={onCancel}
      />
    );
  }

  return (
    <MatchQueueScreen
      position={position}
      max={max}
      gridRows={info?.gridRows}
      gridCols={info?.gridCols}
      onCancel={onCancel}
    />
  );
}

// ─── Private room: hero invite code + player slots ────────────────────

function PrivateQueueScreen({
  code,
  position,
  max,
  onCancel
}: {
  code: string;
  position: number;
  max: number;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const slots = max || 4;

  async function handleCopy() {
    try { await navigator.clipboard.writeText(code); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="relative mx-auto grid w-full max-w-[640px] gap-8 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <header className="grid gap-3 text-center">
        <h1 className="font-display text-4xl leading-none text-white game-text-shadow sm:text-6xl">
          Room created!
        </h1>
        <p className="text-base font-semibold text-white/90">
          Share this code with friends. The game starts when {max} player{max === 1 ? "" : "s"} have joined.
        </p>
      </header>

      {/* Invite code tiles */}
      <div className="panel-card grid gap-6 p-6 sm:p-8">
        <div className="invite-code-tiles">
          {code.split("").map((ch, i) => (
            <span
              key={i}
              className="invite-code-tile"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {ch}
            </span>
          ))}
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCopy}
            className={
              "inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors " +
              (copied
                ? "border-success/60 bg-success/10 text-success"
                : "border-secondary/50 bg-secondary/10 text-secondary-deep hover:border-secondary hover:bg-secondary/20")
            }
          >
            {copied ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span>{copied ? "Copied!" : "Copy code"}</span>
          </button>
        </div>

        {/* Player slots */}
        <div className="grid gap-2 border-t-2 border-line pt-4">
          <div className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.28em] text-fg-muted">
            <span>Players</span>
            <span>
              <span className="text-fg">{position}</span>
              <span className="opacity-60">/{max || "?"}</span>
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: slots }, (_, i) => (
              <div
                key={i}
                className={
                  "h-2.5 flex-1 rounded-full transition-colors duration-500 " +
                  (i < position ? "bg-secondary" : "bg-line")
                }
              />
            ))}
          </div>
        </div>
      </div>

      <Button variant="ghost" size="md" onClick={onCancel} className="justify-self-center">
        <X size={14} aria-hidden="true" />
        Leave room
      </Button>
    </div>
  );
}

// ─── Quick match queue ────────────────────────────────────────────────

function MatchQueueScreen({
  position,
  max,
  gridRows,
  gridCols,
  onCancel
}: {
  position: number;
  max: number;
  gridRows?: number;
  gridCols?: number;
  onCancel: () => void;
}) {
  const slots = max || 4;
  const preset = gridRows && gridCols ? presetForGrid(gridRows, gridCols) : null;
  const boardLabel = preset
    ? `${preset.label} board`
    : gridRows && gridCols
      ? `${gridRows}×${gridCols} board`
      : null;

  return (
    <div className="relative mx-auto grid w-full max-w-[640px] gap-8 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <header className="grid gap-3 text-center">
        <h1 className="font-display text-4xl leading-none text-white game-text-shadow sm:text-6xl">
          Finding players…
        </h1>
        <p className="text-base font-semibold text-white/90">
          {boardLabel ? `${boardLabel} · ` : ""}waiting for {max || "more"} players
        </p>
      </header>

      {/* Bouncing orbs */}
      <div className="relative mx-auto h-[140px] w-full max-w-[280px]">
        {[
          { color: PLAYER_COLORS[0], x: "18%", y: "45%", s: 44 },
          { color: PLAYER_COLORS[1], x: "44%", y: "30%", s: 56 },
          { color: PLAYER_COLORS[3], x: "72%", y: "50%", s: 40 },
          { color: PLAYER_COLORS[2], x: "34%", y: "72%", s: 32 },
          { color: PLAYER_COLORS[6], x: "62%", y: "76%", s: 38 },
        ].map((orb, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.s,
              height: orb.s,
              background: `radial-gradient(circle at 32% 30%, #fff, ${orb.color} 55%, color-mix(in srgb, ${orb.color} 55%, #000))`,
              boxShadow: "0 4px 10px rgba(20,60,110,0.35)",
              animation: `orb-pulse ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="panel-card mx-auto grid w-full max-w-[420px] gap-3 p-5">
        <div className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-[0.28em] text-fg-muted">
          <span>Players found</span>
          <span>
            <span className="text-fg">{position}</span>
            <span className="opacity-60">/{max || "?"}</span>
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: slots }, (_, i) => (
            <div
              key={i}
              className={
                "h-2.5 flex-1 rounded-full transition-colors duration-300 " +
                (i < position ? "bg-primary" : "bg-line")
              }
            />
          ))}
        </div>
      </div>

      <Button variant="ghost" size="md" onClick={onCancel} className="justify-self-center">
        <X size={14} aria-hidden="true" />
        Cancel
      </Button>
    </div>
  );
}
