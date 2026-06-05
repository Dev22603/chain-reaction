"use client";

import { Settings2 } from "lucide-react";
import { useMemo } from "react";
import { BOARD_PRESETS } from "@/lib/presets";

interface BoardSizePickerProps {
  gridRows: number;
  gridCols: number;
  advanced: boolean;
  onToggleAdvanced: () => void;
  onChangeRows: (next: number) => void;
  onChangeCols: (next: number) => void;
  onSelectPreset: (rows: number, cols: number) => void;
}

export function BoardSizePicker({
  gridRows,
  gridCols,
  advanced,
  onToggleAdvanced,
  onChangeRows,
  onChangeCols,
  onSelectPreset
}: BoardSizePickerProps) {
  const matchingPreset = useMemo(
    () => BOARD_PRESETS.find((preset) => preset.gridRows === gridRows && preset.gridCols === gridCols),
    [gridRows, gridCols]
  );

  return (
    <section className="grid gap-2 sm:gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-xs tracking-[0.28em] text-fg-muted">BOARD</p>
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted transition-colors hover:border-cherenkov hover:text-cherenkov"
        >
          <Settings2 size={11} aria-hidden="true" />
          {advanced ? "Use preset" : "Custom size"}
        </button>
      </div>

      {!advanced ? (
        <BoardPresetGrid
          activeLabel={matchingPreset?.label}
          onSelect={onSelectPreset}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Rows" value={gridRows} onChange={onChangeRows} min={3} max={20} />
          <NumberField label="Cols" value={gridCols} onChange={onChangeCols} min={3} max={20} />
        </div>
      )}

      <div className="hidden sm:block">
        <BoardPreview rows={gridRows} cols={gridCols} />
      </div>
    </section>
  );
}

function BoardPresetGrid({
  activeLabel,
  onSelect
}: {
  activeLabel: string | undefined;
  onSelect: (rows: number, cols: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {BOARD_PRESETS.map((preset) => {
        const active = activeLabel === preset.label;
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset.gridRows, preset.gridCols)}
            className={
              "group grid gap-0.5 rounded-lg border-2 px-3 py-2 text-left transition-all sm:py-2.5 " +
              (active
                ? "border-cherenkov bg-cherenkov/10 text-white shadow-cherenkov"
                : "border-line bg-bg/40 text-fg-soft hover:-translate-y-0.5 hover:border-line-2 hover:text-fg")
            }
          >
            <span className="font-display text-sm leading-none tracking-tight">{preset.label}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] opacity-70">
              {preset.gridRows}×{preset.gridCols}
            </span>
          </button>
        );
      })}
    </div>
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
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-fg-muted">Preview</p>
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
