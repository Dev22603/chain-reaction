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
      <div className="grid gap-6 p-6 sm:p-8">
        <header className="grid gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2 id="create-room-title" className="font-display text-4xl leading-[0.95] tracking-tight text-white game-text-shadow sm:text-5xl">
              CREATE
              <br />
              <span className="text-reactor">A ROOM</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-line text-fg-muted transition-colors hover:border-reactor hover:text-reactor"
              aria-label="Close dialog"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="max-w-md font-body text-sm text-fg-soft sm:text-base">
            Pick your settings and share the code with friends — no signup needed.
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl border-2 border-line bg-bg-soft/40 p-5">
          <p className="font-display text-sm text-fg-soft">
            Players
          </p>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => adjustPlayers(-1)}
              disabled={players <= 2}
              className="grid h-12 w-12 place-items-center rounded-full border-2 border-line bg-bg/60 text-fg transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30"
              aria-label="Decrease players"
            >
              <Minus size={18} strokeWidth={3} aria-hidden="true" />
            </button>
            <div className="grid flex-1 place-items-center">
              <span className="font-display text-7xl leading-none text-white game-text-shadow sm:text-8xl">
                {players}
              </span>
            </div>
            <button
              type="button"
              onClick={() => adjustPlayers(1)}
              disabled={players >= 8}
              className="grid h-12 w-12 place-items-center rounded-full border-2 border-line bg-bg/60 text-fg transition-colors hover:border-reactor hover:text-reactor disabled:opacity-30"
              aria-label="Increase players"
            >
              <Plus size={18} strokeWidth={3} aria-hidden="true" />
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
                  "h-2 rounded-full transition-colors " +
                  (value <= players ? "bg-reactor" : "bg-line")
                }
                aria-label={`Set ${value} players`}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border-2 border-line bg-bg-soft/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-sm text-fg-soft">
              Board
            </p>
            <button
              type="button"
              onClick={() => {
                setAdvanced((v) => !v);
                onInteract?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/50 px-3 py-1 font-body text-xs font-semibold text-fg-muted transition-colors hover:border-cherenkov hover:text-cherenkov"
            >
              <Settings2 size={12} aria-hidden="true" />
              {advanced ? "Presets" : "Custom"}
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
                      "grid gap-1 rounded-xl border-2 px-3 py-3 text-left transition-colors " +
                      (active
                        ? "border-cherenkov bg-cherenkov/10 text-cherenkov shadow-cherenkov"
                        : "border-line bg-bg/40 text-fg-soft hover:border-line-2 hover:text-fg")
                    }
                  >
                    <span className="font-display text-sm">
                      {preset.label}
                    </span>
                    <span className="font-body text-xs font-semibold opacity-70">
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-line bg-surface/60 px-5 py-3 font-display text-sm text-fg-soft transition-colors hover:border-fg-muted hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="game-btn-shadow inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-reactor-glow to-reactor px-6 py-3.5 font-display text-lg text-white game-text-shadow sm:min-w-[260px]"
          >
            <Check size={18} strokeWidth={3} aria-hidden="true" />
            Create room
          </button>
        </footer>

        <p className="border-t border-line/60 pt-4 text-center font-body text-xs text-fg-muted">
          You&apos;ll get a 6-character code to share.
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
      <span className="font-body text-sm font-semibold text-fg-muted">
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
        className="min-h-12 rounded-xl border-2 border-line bg-bg px-4 font-body text-lg font-semibold text-fg focus:border-cherenkov focus:outline-none"
      />
    </label>
  );
}

function BoardPreview({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="grid gap-2">
      <div
        className="relative aspect-[16/9] overflow-hidden rounded-xl border-2 border-line bg-black/50"
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
      <div className="flex items-center justify-between font-body text-xs font-semibold text-fg-muted">
        <span>Preview</span>
        <span className="text-cherenkov">{rows} × {cols} board</span>
      </div>
    </div>
  );
}
