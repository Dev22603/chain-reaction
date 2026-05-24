"use client";

import { Check, Minus, Plus, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DialogShell } from "@/components/dialogs/DialogShell";
import { BOARD_PRESETS } from "@/lib/presets";

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

const PLAYER_TINTS: Record<number, string> = {
  2: "#ff3b6b",
  3: "#2ad8ff",
  4: "#ffd23f",
  5: "#5cff9b",
  6: "#ff3da7",
  7: "#ff6b1f",
  8: "#b6ff3c"
};

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
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    if (open) {
      setPlayers(defaultPlayers);
      setGridRows(DEFAULT_PRESET.gridRows);
      setGridCols(DEFAULT_PRESET.gridCols);
      setAdvanced(false);
    }
  }, [open, defaultPlayers]);

  const matchingPreset = useMemo(
    () => BOARD_PRESETS.find((preset) => preset.gridRows === gridRows && preset.gridCols === gridCols),
    [gridRows, gridCols]
  );

  function handleConfirm() {
    onInteract?.();
    onConfirm({ players, gridRows, gridCols });
  }

  function adjustPlayers(delta: number) {
    setPlayers((current) => Math.min(8, Math.max(2, current + delta)));
    onInteract?.();
  }

  const activeTint = PLAYER_TINTS[players] ?? "#ff6b1f";

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      titleId="create-room-title"
      width="lg"
      accent="reactor"
    >
      <div className="grid gap-4 p-4 sm:gap-6 sm:p-7">
        {/* ── Header ── */}
        <header className="flex items-center justify-between gap-3">
          <h2
            id="create-room-title"
            className="font-display whitespace-nowrap text-[1.55rem] leading-none tracking-tight text-white game-text-shadow sm:text-[2.25rem]"
          >
            CREATE <span className="text-reactor">ROOM</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line text-fg-muted transition-colors hover:border-reactor hover:text-reactor"
            aria-label="Close dialog"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </header>

        {/* ── Players ── */}
        <section className="grid gap-2 sm:gap-3">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-xs tracking-[0.28em] text-fg-muted">
              PLAYERS
            </p>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted">
              {players === 2 ? "1 v 1" : `${players}-way`}
            </span>
          </div>
          <div className="flex items-stretch gap-3">
            <button
              type="button"
              onClick={() => adjustPlayers(-1)}
              disabled={players <= 2}
              className="grid h-[52px] w-[48px] shrink-0 place-items-center rounded-xl border-2 border-line bg-bg text-fg transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30 sm:h-[68px] sm:w-[60px]"
              aria-label="Decrease players"
            >
              <Minus size={20} strokeWidth={3} aria-hidden="true" />
            </button>
            <div
              className="relative grid h-[52px] flex-1 place-items-center overflow-hidden rounded-xl border-2 sm:h-[68px]"
              style={{
                borderColor: `color-mix(in srgb, ${activeTint} 65%, var(--color-line))`,
                background: `radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, ${activeTint} 22%, transparent), transparent 70%), rgba(10,4,32,0.55)`
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 bottom-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${activeTint}, transparent)` }}
              />
              <span
                className="font-display text-4xl leading-none text-white game-text-shadow sm:text-[2.75rem]"
                style={{ textShadow: `0 0 28px color-mix(in srgb, ${activeTint} 60%, transparent), 0 4px 0 rgba(0,0,0,0.45)` }}
              >
                {players}
              </span>
            </div>
            <button
              type="button"
              onClick={() => adjustPlayers(1)}
              disabled={players >= 8}
              className="grid h-[52px] w-[48px] shrink-0 place-items-center rounded-xl border-2 border-line bg-bg text-fg transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30 sm:h-[68px] sm:w-[60px]"
              aria-label="Increase players"
            >
              <Plus size={20} strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[2, 3, 4, 5, 6, 7, 8].map((value) => {
              const on = value <= players;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setPlayers(value);
                    onInteract?.();
                  }}
                  className="group grid h-4 place-items-center"
                  aria-label={`Set ${value} players`}
                >
                  <span
                    className="block h-1.5 w-full rounded-full transition-all"
                    style={{
                      background: on ? PLAYER_TINTS[value] : "var(--color-line)",
                      boxShadow: on ? `0 0 10px color-mix(in srgb, ${PLAYER_TINTS[value]} 70%, transparent)` : undefined
                    }}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Board ── */}
        <section className="grid gap-2 sm:gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-xs tracking-[0.28em] text-fg-muted">
              BOARD
            </p>
            <button
              type="button"
              onClick={() => {
                setAdvanced((v) => !v);
                onInteract?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted transition-colors hover:border-cherenkov hover:text-cherenkov"
            >
              <Settings2 size={11} aria-hidden="true" />
              {advanced ? "Use preset" : "Custom size"}
            </button>
          </div>

          {!advanced ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BOARD_PRESETS.map((preset) => {
                const active = matchingPreset?.label === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setGridRows(preset.gridRows);
                      setGridCols(preset.gridCols);
                      onInteract?.();
                    }}
                    className={
                      "group grid gap-0.5 rounded-lg border-2 px-3 py-2 text-left transition-all sm:py-2.5 " +
                      (active
                        ? "border-cherenkov bg-cherenkov/10 text-white shadow-cherenkov"
                        : "border-line bg-bg/40 text-fg-soft hover:-translate-y-0.5 hover:border-line-2 hover:text-fg")
                    }
                  >
                    <span className="font-display text-sm leading-none tracking-tight">
                      {preset.label}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] opacity-70">
                      {preset.gridRows}×{preset.gridCols}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Rows" value={gridRows} onChange={setGridRows} min={3} max={20} />
              <NumberField label="Cols" value={gridCols} onChange={setGridCols} min={3} max={20} />
            </div>
          )}

          <div className="hidden sm:block">
            <BoardPreview rows={gridRows} cols={gridCols} />
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="flex items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-line bg-surface/60 px-3.5 py-2 font-display text-xs text-fg-soft transition-colors hover:border-fg-muted hover:text-fg sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="game-btn-shadow inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-b from-reactor-glow to-reactor px-4 py-2.5 font-display text-sm text-white game-text-shadow sm:flex-none sm:px-5 sm:py-3 sm:text-base sm:min-w-[180px]"
          >
            <Check size={16} strokeWidth={3} aria-hidden="true" />
            Create room
          </button>
        </footer>
      </div>
    </DialogShell>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="font-display text-[11px] tracking-[0.22em] text-fg-muted">
        {label.toUpperCase()}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isNaN(next)) onChange(Math.min(max, Math.max(min, next)));
        }}
        className="h-12 rounded-xl border-2 border-line bg-bg px-4 font-display text-2xl text-white focus:border-cherenkov focus:outline-none"
      />
    </label>
  );
}

function BoardPreview({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border-2 border-line/70 bg-black/40 px-2.5 py-1.5 sm:px-3 sm:py-2">
      <div
        className="relative h-8 w-16 shrink-0 overflow-hidden rounded border border-line/80 sm:h-10 sm:w-20"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,211,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,91,46,0.22) 1px, transparent 1px)",
            backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`
          }}
        />
        <span className="absolute left-[18%] top-[26%] h-2 w-2 rounded-full bg-p1 shadow-[0_0_12px_rgba(255,59,107,0.85)]" />
        <span className="absolute left-[56%] top-[46%] h-2 w-2 rounded-full bg-p2 shadow-[0_0_12px_rgba(37,211,255,0.85)]" />
        <span className="absolute bottom-[20%] right-[18%] h-1.5 w-1.5 rounded-full bg-uranium shadow-[0_0_10px_rgba(255,210,63,0.8)]" />
      </div>
      <div className="flex-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-fg-muted">
          Preview
        </p>
        <p className="font-body text-[11px] font-semibold text-fg-soft">
          {rows * cols} cells · {rows}×{cols}
        </p>
      </div>
      <span className="font-display text-lg leading-none text-cherenkov">
        {rows}×{cols}
      </span>
    </div>
  );
}
