"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { DialogShell } from "@/components/dialogs/DialogShell";
import {
  BoardPresetGrid,
  MatchDialogFooter,
  MatchDialogHeader,
  PlayerCountField,
  type MatchConfig
} from "@/components/dialogs/MatchDialogParts";
import { DEFAULT_BOARD_PRESET } from "@/lib/presets";
import { clampPlayerCount } from "@/lib/constants";

interface CreateRoomDialogProps {
  open: boolean;
  defaultPlayers: number;
  onClose: () => void;
  onConfirm: (config: MatchConfig) => void;
  onInteract?: () => void;
}

function initialConfig(defaultPlayers: number): MatchConfig {
  return {
    players: clampPlayerCount(defaultPlayers),
    gridRows: DEFAULT_BOARD_PRESET.gridRows,
    gridCols: DEFAULT_BOARD_PRESET.gridCols
  };
}

export function CreateRoomDialog({
  open,
  defaultPlayers,
  onClose,
  onConfirm,
  onInteract
}: CreateRoomDialogProps) {
  const [config, setConfig] = useState<MatchConfig>(() => initialConfig(defaultPlayers));

  useEffect(() => {
    if (open) setConfig(initialConfig(defaultPlayers));
  }, [open, defaultPlayers]);

  function handleConfirm() {
    onInteract?.();
    onConfirm(config);
  }

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      titleId="create-room-title"
      width="lg"
      accent="primary"
    >
      <div className="grid gap-4 p-4 sm:gap-6 sm:p-7">
        <MatchDialogHeader
          titleId="create-room-title"
          title="CREATE"
          highlight="ROOM"
          onClose={onClose}
        />

        <PlayerCountField
          players={config.players}
          onChange={(players) => {
            setConfig((current) => ({ ...current, players }));
            onInteract?.();
          }}
        />

        <section className="grid gap-2 sm:gap-3">
          <p className="font-display text-xs tracking-[0.28em] text-fg-muted">BOARD</p>
          <BoardPresetGrid
            gridRows={config.gridRows}
            gridCols={config.gridCols}
            onPick={(preset) => {
              setConfig((current) => ({
                ...current,
                gridRows: preset.gridRows,
                gridCols: preset.gridCols
              }));
              onInteract?.();
            }}
          />

          <div className="hidden sm:block">
            <BoardPreview rows={config.gridRows} cols={config.gridCols} />
          </div>
        </section>

        <MatchDialogFooter
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel="Create room"
          confirmIcon={<Check size={16} strokeWidth={3} aria-hidden="true" />}
        />
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
