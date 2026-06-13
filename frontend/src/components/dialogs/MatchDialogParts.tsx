"use client";

import { Minus, Plus, X } from "lucide-react";
import { BOARD_PRESETS, type BoardPreset } from "@/lib/presets";
import { clampPlayerCount, MAX_PLAYERS, MIN_PLAYERS } from "@/lib/constants";
import { playerColor } from "@/lib/colors";

// Building blocks shared by the quick-match and create-room dialogs, which
// configure the same thing (a match) with the same controls.

/** Match settings produced by the quick-match and create-room dialogs. */
export interface MatchConfig {
  players: number;
  gridRows: number;
  gridCols: number;
}

interface MatchDialogHeaderProps {
  titleId: string;
  title: string;
  /** Second word of the title, rendered in the primary accent color. */
  highlight: string;
  onClose: () => void;
}

export function MatchDialogHeader({ titleId, title, highlight, onClose }: MatchDialogHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3">
      <h2
        id={titleId}
        className="whitespace-nowrap font-display text-[1.55rem] leading-none text-fg sm:text-[2.25rem]"
      >
        {title} <span className="text-primary">{highlight}</span>
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line text-fg-muted transition-colors hover:border-primary hover:text-primary"
        aria-label="Close dialog"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </header>
  );
}

interface BoardPresetGridProps {
  gridRows: number;
  gridCols: number;
  onPick: (preset: BoardPreset) => void;
}

export function BoardPresetGrid({ gridRows, gridCols, onPick }: BoardPresetGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {BOARD_PRESETS.map((preset) => {
        const active = preset.gridRows === gridRows && preset.gridCols === gridCols;
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onPick(preset)}
            className={
              "group grid gap-0.5 rounded-xl border-2 px-3 py-2 text-left transition-all sm:py-2.5 " +
              (active
                ? "border-secondary bg-secondary/10 text-secondary-deep shadow-[0_4px_0_rgba(24,73,128,0.12)]"
                : "border-line bg-surface text-fg-soft hover:-translate-y-0.5 hover:border-line-2 hover:text-fg")
            }
          >
            <span className="font-display text-sm leading-none">{preset.label}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
              {preset.gridRows}×{preset.gridCols}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const STEP_BUTTON_CLASS =
  "grid h-[52px] w-[48px] shrink-0 place-items-center rounded-xl border-2 border-line bg-surface text-fg transition-colors hover:border-primary hover:text-primary disabled:opacity-30 sm:h-[64px] sm:w-[60px]";

interface PlayerCountFieldProps {
  players: number;
  /** Receives the new player count, already clamped to MIN/MAX_PLAYERS. */
  onChange: (players: number) => void;
}

export function PlayerCountField({ players, onChange }: PlayerCountFieldProps) {
  const activeTint = playerColor(players - 1);

  function adjust(delta: number) {
    onChange(clampPlayerCount(players + delta));
  }

  return (
    <section className="grid gap-2 sm:gap-3">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xs tracking-[0.28em] text-fg-muted">PLAYERS</p>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-fg-muted">
          {players === 2 ? "1 v 1" : `${players}-way`}
        </span>
      </div>
      <div className="flex items-stretch gap-3">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={players <= MIN_PLAYERS}
          className={STEP_BUTTON_CLASS}
          aria-label="Decrease players"
        >
          <Minus size={20} strokeWidth={3} aria-hidden="true" />
        </button>
        <div
          className="relative grid h-[52px] flex-1 place-items-center overflow-hidden rounded-xl border-2 bg-surface-2 sm:h-[64px]"
          style={{ borderColor: activeTint }}
        >
          <span className="font-display text-4xl leading-none text-fg sm:text-[2.5rem]">
            {players}
          </span>
        </div>
        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={players >= MAX_PLAYERS}
          className={STEP_BUTTON_CLASS}
          aria-label="Increase players"
        >
          <Plus size={20} strokeWidth={3} aria-hidden="true" />
        </button>
      </div>
      <PlayerPips players={players} onPick={onChange} />
    </section>
  );
}

export function PlayerPips({ players, onPick }: { players: number; onPick: (value: number) => void }) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${MAX_PLAYERS - MIN_PLAYERS + 1}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map((value) => {
        const on = value <= players;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className="group grid h-4 place-items-center"
            aria-label={`Set ${value} players`}
          >
            <span
              className="block h-1.5 w-full rounded-full transition-all group-hover:scale-y-150"
              style={{ background: on ? playerColor(value - 1) : "var(--color-line)" }}
            />
          </button>
        );
      })}
    </div>
  );
}

interface MatchDialogFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmIcon: React.ReactNode;
}

export function MatchDialogFooter({ onCancel, onConfirm, confirmLabel, confirmIcon }: MatchDialogFooterProps) {
  return (
    <footer className="flex items-center justify-between gap-2 sm:gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border-2 border-line bg-surface px-3.5 py-2 font-display text-xs text-fg-soft transition-colors hover:border-fg-muted hover:text-fg sm:px-4 sm:py-2.5 sm:text-sm"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="game-btn-shadow inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[3px] border-white/90 bg-gradient-to-b from-primary-glow to-primary px-4 py-2.5 font-display text-sm text-white [--btn-depth:var(--color-primary-deep)] sm:min-w-[180px] sm:flex-none sm:px-5 sm:py-3 sm:text-base"
      >
        {confirmIcon}
        {confirmLabel}
      </button>
    </footer>
  );
}
