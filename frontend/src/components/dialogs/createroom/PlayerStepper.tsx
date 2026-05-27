"use client";

import { Minus, Plus } from "lucide-react";
import { playerColor } from "@/lib/colors";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const PLAYER_VALUES = [2, 3, 4, 5, 6, 7, 8] as const;

interface PlayerStepperProps {
  players: number;
  onChange: (next: number) => void;
  onInteract?: () => void;
}

export function PlayerStepper({ players, onChange, onInteract }: PlayerStepperProps) {
  const activeTint = playerColor(players - MIN_PLAYERS);

  function adjust(delta: number) {
    onChange(Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, players + delta)));
    onInteract?.();
  }

  function select(value: number) {
    onChange(value);
    onInteract?.();
  }

  return (
    <section className="grid gap-2 sm:gap-3">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xs tracking-[0.28em] text-fg-muted">PLAYERS</p>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted">
          {players === 2 ? "1 v 1" : `${players}-way`}
        </span>
      </div>

      <div className="flex items-stretch gap-3">
        <StepperButton
          direction="down"
          disabled={players <= MIN_PLAYERS}
          onClick={() => adjust(-1)}
        />
        <PlayerReadout count={players} tint={activeTint} />
        <StepperButton
          direction="up"
          disabled={players >= MAX_PLAYERS}
          onClick={() => adjust(1)}
        />
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {PLAYER_VALUES.map((value) => (
          <PlayerPip
            key={value}
            value={value}
            active={value <= players}
            onClick={() => select(value)}
          />
        ))}
      </div>
    </section>
  );
}

function StepperButton({
  direction,
  disabled,
  onClick
}: {
  direction: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "up" ? Plus : Minus;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "up" ? "Increase players" : "Decrease players"}
      className="grid h-[52px] w-[48px] shrink-0 place-items-center rounded-xl border-2 border-line bg-bg text-fg transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30 sm:h-[68px] sm:w-[60px]"
    >
      <Icon size={20} strokeWidth={3} aria-hidden="true" />
    </button>
  );
}

function PlayerReadout({ count, tint }: { count: number; tint: string }) {
  return (
    <div
      className="relative grid h-[52px] flex-1 place-items-center overflow-hidden rounded-xl border-2 sm:h-[68px]"
      style={{
        borderColor: `color-mix(in srgb, ${tint} 65%, var(--color-line))`,
        background: `radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, ${tint} 22%, transparent), transparent 70%), rgba(10,4,32,0.55)`
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 bottom-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${tint}, transparent)` }}
      />
      <span
        className="font-display text-4xl leading-none text-white game-text-shadow sm:text-[2.75rem]"
        style={{
          textShadow: `0 0 28px color-mix(in srgb, ${tint} 60%, transparent), 0 4px 0 rgba(0,0,0,0.45)`
        }}
      >
        {count}
      </span>
    </div>
  );
}

function PlayerPip({
  value,
  active,
  onClick
}: {
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  const color = playerColor(value - MIN_PLAYERS);
  return (
    <button type="button" onClick={onClick} className="group grid h-4 place-items-center" aria-label={`Set ${value} players`}>
      <span
        className="block h-1.5 w-full rounded-full transition-all"
        style={{
          background: active ? color : "var(--color-line)",
          boxShadow: active ? `0 0 10px color-mix(in srgb, ${color} 70%, transparent)` : undefined
        }}
      />
    </button>
  );
}
