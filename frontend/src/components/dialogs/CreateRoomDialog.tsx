"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DialogShell } from "@/components/dialogs/DialogShell";
import { PlayerPips } from "@/components/dialogs/PlayDialog";
import { BOARD_PRESETS } from "@/lib/presets";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/constants";
import { playerColor } from "@/lib/colors";

export interface CreateRoomConfig {
  players: number;
  gridRows: number;
  gridCols: number;
}

interface CreateRoomDialogProps {
  open: boolean;
  defaultPlayers: number;
  onClose: () => void;
  onConfirm: (config: CreateRoomConfig) => void;
  onInteract?: () => void;
}

const DEFAULT_PRESET = BOARD_PRESETS[1];

export function CreateRoomDialog({
  open,
  defaultPlayers,
  onClose,
  onConfirm,
  onInteract
}: CreateRoomDialogProps) {
  const [players, setPlayers] = useState<number>(defaultPlayers);
  const [gridRows, setGridRows] = useState<number>(DEFAULT_PRESET.gridRows);
  const [gridCols, setGridCols] = useState<number>(DEFAULT_PRESET.gridCols);

  useEffect(() => {
    if (open) {
      setPlayers(Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, defaultPlayers)));
      setGridRows(DEFAULT_PRESET.gridRows);
      setGridCols(DEFAULT_PRESET.gridCols);
    }
  }, [open, defaultPlayers]);

  function handleConfirm() {
    onInteract?.();
    onConfirm({ players, gridRows, gridCols });
  }

  function adjustPlayers(delta: number) {
    setPlayers((current) => Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, current + delta)));
    onInteract?.();
  }

  const activeTint = playerColor(players - 1);

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      titleId="create-room-title"
      width="lg"
      accent="primary"
    >
      <div className="grid gap-4 p-4 sm:gap-6 sm:p-7">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <h2
            id="create-room-title"
            className="whitespace-nowrap font-display text-[1.55rem] leading-none text-fg sm:text-[2.25rem]"
          >
            CREATE <span className="text-primary">ROOM</span>
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

        {/* Board */}
        <section className="grid gap-2 sm:gap-3">
          <p className="font-display text-xs tracking-[0.28em] text-fg-muted">BOARD</p>
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

          <div className="hidden sm:block">
            <BoardPreview rows={gridRows} cols={gridCols} />
          </div>
        </section>

        {/* Footer */}
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
            <Check size={16} strokeWidth={3} aria-hidden="true" />
            Create room
          </button>
        </footer>
      </div>
    </DialogShell>
  );
}

function BoardPreview({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border-2 border-line bg-surface-2 px-2.5 py-1.5 sm:px-3 sm:py-2">
      <div
        className="relative h-8 w-16 shrink-0 overflow-hidden rounded border border-line-2 bg-surface sm:h-10 sm:w-20"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(47,155,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,138,0,0.25) 1px, transparent 1px)",
            backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`
          }}
        />
        <span className="absolute left-[18%] top-[26%] h-2 w-2 rounded-full bg-p1" />
        <span className="absolute left-[56%] top-[46%] h-2 w-2 rounded-full bg-p2" />
        <span className="absolute bottom-[20%] right-[18%] h-1.5 w-1.5 rounded-full bg-p4" />
      </div>
      <div className="flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-fg-muted">Preview</p>
        <p className="text-[11px] font-semibold text-fg-soft">
          {rows * cols} cells · {rows}×{cols}
        </p>
      </div>
      <span className="font-display text-lg leading-none text-secondary-deep">
        {rows}×{cols}
      </span>
    </div>
  );
}
