"use client";

import { Minus, Play, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DialogShell } from "@/components/dialogs/DialogShell";
import { BOARD_PRESETS } from "@/lib/presets";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/constants";
import { playerColor } from "@/lib/colors";

export interface PlayConfig {
  players: number;
  gridRows: number;
  gridCols: number;
}

interface PlayDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: PlayConfig) => void;
  onInteract?: () => void;
}

const STORAGE_KEY = "cr.play.settings";
const DEFAULT_PRESET = BOARD_PRESETS[1];

function loadSavedConfig(): PlayConfig {
  if (typeof window === "undefined") {
    return { players: 2, gridRows: DEFAULT_PRESET.gridRows, gridCols: DEFAULT_PRESET.gridCols };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayConfig>;
      const preset = BOARD_PRESETS.find(
        (p) => p.gridRows === parsed.gridRows && p.gridCols === parsed.gridCols
      );
      const players = Number(parsed.players);
      if (preset && Number.isInteger(players) && players >= MIN_PLAYERS && players <= MAX_PLAYERS) {
        return { players, gridRows: preset.gridRows, gridCols: preset.gridCols };
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return { players: 2, gridRows: DEFAULT_PRESET.gridRows, gridCols: DEFAULT_PRESET.gridCols };
}

export function PlayDialog({ open, onClose, onConfirm, onInteract }: PlayDialogProps) {
  const [players, setPlayers] = useState<number>(2);
  const [gridRows, setGridRows] = useState<number>(DEFAULT_PRESET.gridRows);
  const [gridCols, setGridCols] = useState<number>(DEFAULT_PRESET.gridCols);

  useEffect(() => {
    if (open) {
      const saved = loadSavedConfig();
      setPlayers(saved.players);
      setGridRows(saved.gridRows);
      setGridCols(saved.gridCols);
    }
  }, [open]);

  function adjustPlayers(delta: number) {
    setPlayers((current) => Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, current + delta)));
    onInteract?.();
  }

  function handleConfirm() {
    onInteract?.();
    const config = { players, gridRows, gridCols };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* storage unavailable, still play */
    }
    onConfirm(config);
  }

  const activeTint = playerColor(players - 1);

  return (
    <DialogShell open={open} onClose={onClose} titleId="play-title" width="lg" accent="primary">
      <div className="grid gap-4 p-4 sm:gap-6 sm:p-7">
        <header className="flex items-center justify-between gap-3">
          <h2
            id="play-title"
            className="whitespace-nowrap font-display text-[1.55rem] leading-none text-fg sm:text-[2.25rem]"
          >
            QUICK <span className="text-primary">MATCH</span>
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

        {/* Board size */}
        <section className="grid gap-2 sm:gap-3">
          <p className="font-display text-xs tracking-[0.28em] text-fg-muted">BOARD SIZE</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BOARD_PRESETS.map((preset) => {
              const active = preset.gridRows === gridRows && preset.gridCols === gridCols;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setGridRows(preset.gridRows);
                    setGridCols(preset.gridCols);
                    onInteract?.();
                  }}
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
        </section>

        {/* Players */}
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
              onClick={() => adjustPlayers(-1)}
              disabled={players <= MIN_PLAYERS}
              className="grid h-[52px] w-[48px] shrink-0 place-items-center rounded-xl border-2 border-line bg-surface text-fg transition-colors hover:border-primary hover:text-primary disabled:opacity-30 sm:h-[64px] sm:w-[60px]"
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
              onClick={() => adjustPlayers(1)}
              disabled={players >= MAX_PLAYERS}
              className="grid h-[52px] w-[48px] shrink-0 place-items-center rounded-xl border-2 border-line bg-surface text-fg transition-colors hover:border-primary hover:text-primary disabled:opacity-30 sm:h-[64px] sm:w-[60px]"
              aria-label="Increase players"
            >
              <Plus size={20} strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
          <PlayerPips players={players} onPick={(value) => { setPlayers(value); onInteract?.(); }} />
        </section>

        <footer className="flex items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-line bg-surface px-3.5 py-2 font-display text-xs text-fg-soft transition-colors hover:border-fg-muted hover:text-fg sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="game-btn-shadow inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[3px] border-white/90 bg-gradient-to-b from-primary-glow to-primary px-4 py-2.5 font-display text-sm text-white [--btn-depth:var(--color-primary-deep)] sm:min-w-[180px] sm:flex-none sm:px-5 sm:py-3 sm:text-base"
          >
            <Play size={16} strokeWidth={3} fill="currentColor" aria-hidden="true" />
            Find match
          </button>
        </footer>
      </div>
    </DialogShell>
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
