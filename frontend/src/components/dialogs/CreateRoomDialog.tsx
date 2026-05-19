"use client";

import { Check, Minus, Plus, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DialogShell } from "@/components/dialogs/DialogShell";
import { Button } from "@/components/ui/button";
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
      <div className="grid gap-7 p-6 sm:p-8">
        <header className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-reactor">
              // private lobby
            </p>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center border border-line text-fg-muted hover:border-reactor hover:text-reactor"
              aria-label="Close dialog"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <h2 id="create-room-title" className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tight text-fg sm:text-6xl">
            Create
            <br />
            <span className="text-reactor">a room</span>
          </h2>
          <p className="max-w-md font-editorial text-base italic text-fg-soft">
            Configure the lattice. Share the code with friends. No accounts needed.
          </p>
        </header>

        <section className="grid gap-4 border border-line bg-bg-soft/50 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.4em] text-fg-soft">
              <span className="text-reactor">A.</span> Reactors
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted">
              {players === 2 ? "duel" : players <= 4 ? "rally" : players <= 6 ? "skirmish" : "melee"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => adjustPlayers(-1)}
              disabled={players <= 2}
              className="grid h-12 w-12 place-items-center border border-line bg-bg text-fg-soft transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30"
              aria-label="Decrease players"
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <div className="grid flex-1 place-items-center">
              <span className="font-display text-7xl font-black leading-none text-fg sm:text-8xl">
                {players}
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
                players
              </span>
            </div>
            <button
              type="button"
              onClick={() => adjustPlayers(1)}
              disabled={players >= 8}
              className="grid h-12 w-12 place-items-center border border-line bg-bg text-fg-soft transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30"
              aria-label="Increase players"
            >
              <Plus size={18} aria-hidden="true" />
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
                  "h-1.5 transition-colors " +
                  (value <= players ? "bg-reactor" : "bg-line")
                }
                aria-label={`Set ${value} players`}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-4 border border-line bg-bg-soft/50 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.4em] text-fg-soft">
              <span className="text-reactor">B.</span> Lattice
            </p>
            <button
              type="button"
              onClick={() => {
                setAdvanced((v) => !v);
                onInteract?.();
              }}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted hover:text-cherenkov"
            >
              <Settings2 size={11} aria-hidden="true" />
              {advanced ? "presets" : "custom"}
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
                      "grid gap-1 border px-3 py-3 text-left transition-colors " +
                      (active
                        ? "border-cherenkov bg-cherenkov/10 text-cherenkov shadow-cherenkov"
                        : "border-line bg-bg text-fg-soft hover:border-line-2 hover:text-fg")
                    }
                  >
                    <span className="font-display text-xs font-semibold uppercase tracking-[0.18em]">
                      {preset.label}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
                      {preset.gridRows} × {preset.gridCols}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Rows"
                value={gridRows}
                onChange={setGridRows}
                min={3}
                max={20}
              />
              <NumberField
                label="Cols"
                value={gridCols}
                onChange={setGridCols}
                min={3}
                max={20}
              />
            </div>
          )}

          <BoardPreview rows={gridRows} cols={gridCols} />
        </section>

        <footer className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={handleConfirm} className="sm:min-w-[260px]">
            <Check size={16} strokeWidth={2.5} aria-hidden="true" />
            Forge room
          </Button>
        </footer>

        <p className="border-t border-line/60 pt-4 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
          You'll get a 6-character code to share.
        </p>
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
    <label className="grid gap-2">
      <span className="font-display text-[10px] uppercase tracking-[0.32em] text-fg-muted">
        {label}
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
        className="min-h-12 border border-line bg-bg px-4 font-mono text-lg text-fg focus:border-cherenkov focus:outline-none focus:shadow-cherenkov"
      />
    </label>
  );
}

function BoardPreview({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="grid gap-2">
      <div
        className="relative aspect-[16/9] overflow-hidden border border-line bg-black/50"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,211,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,91,46,0.18) 1px, transparent 1px)",
            backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`
          }}
        />
        <span className="absolute left-[18%] top-[24%] h-3 w-3 rounded-full bg-p1 shadow-[0_0_22px_rgba(255,59,107,0.85)]" />
        <span className="absolute left-[52%] top-[42%] h-2.5 w-2.5 rounded-full bg-p2 shadow-[0_0_22px_rgba(37,211,255,0.85)]" />
        <span className="absolute bottom-[20%] right-[18%] h-2 w-2 rounded-full bg-uranium shadow-[0_0_18px_rgba(255,210,63,0.8)]" />
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted">
        <span>preview</span>
        <span className="text-cherenkov">{rows} × {cols} cells · {rows * cols} nodes</span>
      </div>
    </div>
  );
}
