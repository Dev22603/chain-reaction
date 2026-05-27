"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BoardSizePicker } from "@/components/dialogs/createroom/BoardSizePicker";
import { DialogShell } from "@/components/dialogs/DialogShell";
import { PlayerStepper } from "@/components/dialogs/createroom/PlayerStepper";
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

  function handleConfirm() {
    onInteract?.();
    onConfirm({ players, gridRows, gridCols });
  }

  function handleSelectPreset(rows: number, cols: number) {
    setGridRows(rows);
    setGridCols(cols);
    onInteract?.();
  }

  function toggleAdvanced() {
    setAdvanced((v) => !v);
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
      <div className="grid gap-4 p-4 sm:gap-6 sm:p-7">
        <DialogHeader onClose={onClose} />

        <PlayerStepper players={players} onChange={setPlayers} onInteract={onInteract} />

        <BoardSizePicker
          gridRows={gridRows}
          gridCols={gridCols}
          advanced={advanced}
          onToggleAdvanced={toggleAdvanced}
          onChangeRows={setGridRows}
          onChangeCols={setGridCols}
          onSelectPreset={handleSelectPreset}
        />

        <DialogFooter onCancel={onClose} onConfirm={handleConfirm} />
      </div>
    </DialogShell>
  );
}

function DialogHeader({ onClose }: { onClose: () => void }) {
  return (
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
  );
}

function DialogFooter({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <footer className="flex items-center justify-between gap-2 sm:gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border-2 border-line bg-surface/60 px-3.5 py-2 font-display text-xs text-fg-soft transition-colors hover:border-fg-muted hover:text-fg sm:px-4 sm:py-2.5 sm:text-sm"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="game-btn-shadow inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-b from-reactor-glow to-reactor px-4 py-2.5 font-display text-sm text-white game-text-shadow sm:flex-none sm:px-5 sm:py-3 sm:text-base sm:min-w-[180px]"
      >
        <Check size={16} strokeWidth={3} aria-hidden="true" />
        Create room
      </button>
    </footer>
  );
}
