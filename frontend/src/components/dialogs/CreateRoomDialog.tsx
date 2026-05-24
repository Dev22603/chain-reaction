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

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      titleId="create-room-title"
      width="lg"
      accent="reactor"
    >
      <div className="grid gap-3.5 p-4 sm:p-5">
        {/* ── Header: single row title + close ── */}
        <header className="flex items-center justify-between gap-3">
          <h2
            id="create-room-title"
            className="font-display text-2xl leading-none tracking-tight text-white game-text-shadow sm:text-3xl"
          >
            CREATE <span className="text-reactor">ROOM</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border-2 border-line text-fg-muted transition-colors hover:border-reactor hover:text-reactor"
            aria-label="Close dialog"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </header>

        {/* ── Players: horizontal stepper, no giant digit ── */}
        <section className="grid gap-2.5 rounded-xl border-2 border-line bg-bg-soft/40 p-3.5">
          <div className="flex items-center justify-between">
            <p className="font-display text-[11px] tracking-[0.22em] text-fg-muted">
              PLAYERS
            </p>
            <span className="font-body text-xs font-semibold text-fg-muted">
              {players === 2 ? "1v1" : `${players}-way`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => adjustPlayers(-1)}
              disabled={players <= 2}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-line bg-bg/60 text-fg transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30"
              aria-label="Decrease players"
            >
              <Minus size={16} strokeWidth={3} aria-hidden="true" />
            </button>
            <div className="relative grid h-10 flex-1 place-items-center overflow-hidden rounded-lg bg-bg/40">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-reactor/60 to-transparent"
              />
              <span className="font-display text-3xl leading-none text-white game-text-shadow">
                {players}
              </span>
            </div>
            <button
              type="button"
              onClick={() => adjustPlayers(1)}
              disabled={players >= 8}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-line bg-bg/60 text-fg transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30"
              aria-label="Increase players"
            >
              <Plus size={16} strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[2, 3, 4, 5, 6, 7, 8].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPlayers(value);
                  onInteract?.();
                }}
                className={
                  "h-1.5 rounded-full transition-colors " +
                  (value <= players ? "bg-reactor" : "bg-line")
                }
                aria-label={`Set ${value} players`}
              />
            ))}
          </div>
        </section>

        {/* ── Board: presets + inline tiny preview ── */}
        <section className="grid gap-2.5 rounded-xl border-2 border-line bg-bg-soft/40 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-[11px] tracking-[0.22em] text-fg-muted">
              BOARD
            </p>
            <button
              type="button"
              onClick={() => {
                setAdvanced((v) => !v);
                onInteract?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/50 px-2.5 py-0.5 font-body text-[11px] font-semibold text-fg-muted transition-colors hover:border-cherenkov hover:text-cherenkov"
            >
              <Settings2 size={11} aria-hidden="true" />
              {advanced ? "Presets" : "Custom"}
            </button>
          </div>

          {!advanced ? (
            <div className="grid grid-cols-4 gap-1.5">
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
                      "grid gap-0.5 rounded-lg border-2 px-2 py-1.5 text-left transition-colors " +
                      (active
                        ? "border-cherenkov bg-cherenkov/10 text-cherenkov shadow-cherenkov"
                        : "border-line bg-bg/40 text-fg-soft hover:border-line-2 hover:text-fg")
                    }
                  >
                    <span className="font-display text-[13px] leading-tight">
                      {preset.label}
                    </span>
                    <span className="font-body text-[10px] font-semibold opacity-70">
                      {preset.gridRows}×{preset.gridCols}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Rows" value={gridRows} onChange={setGridRows} min={3} max={20} />
              <NumberField label="Cols" value={gridCols} onChange={setGridCols} min={3} max={20} />
            </div>
          )}

          <BoardPreview rows={gridRows} cols={gridCols} />
        </section>

        {/* ── Footer: single row ── */}
        <footer className="flex items-center justify-between gap-3 pt-0.5">
          <span className="font-mono text-[11px] text-fg-muted">
            6-char code to share
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-2 border-line bg-surface/60 px-4 py-2 font-display text-xs text-fg-soft transition-colors hover:border-fg-muted hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="game-btn-shadow inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-reactor-glow to-reactor px-5 py-2.5 font-display text-sm text-white game-text-shadow"
            >
              <Check size={14} strokeWidth={3} aria-hidden="true" />
              Create room
            </button>
          </div>
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
    <label className="grid gap-1">
      <span className="font-display text-[10px] tracking-[0.2em] text-fg-muted">
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
        className="h-9 rounded-lg border-2 border-line bg-bg px-3 font-body text-base font-semibold text-fg focus:border-cherenkov focus:outline-none"
      />
    </label>
  );
}

function BoardPreview({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line/60 bg-black/40 px-2.5 py-1.5">
      <div
        className="relative h-9 w-16 shrink-0 overflow-hidden rounded border border-line/80"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,211,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,91,46,0.22) 1px, transparent 1px)",
            backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`
          }}
        />
        <span className="absolute left-[20%] top-[28%] h-1.5 w-1.5 rounded-full bg-p1 shadow-[0_0_10px_rgba(255,59,107,0.85)]" />
        <span className="absolute left-[58%] top-[48%] h-1.5 w-1.5 rounded-full bg-p2 shadow-[0_0_10px_rgba(37,211,255,0.85)]" />
        <span className="absolute bottom-[22%] right-[20%] h-1 w-1 rounded-full bg-uranium shadow-[0_0_8px_rgba(255,210,63,0.8)]" />
      </div>
      <div className="flex-1 font-body text-[11px] font-semibold text-fg-muted">
        Preview
      </div>
      <span className="font-display text-xs text-cherenkov">
        {rows}×{cols}
      </span>
    </div>
  );
}
