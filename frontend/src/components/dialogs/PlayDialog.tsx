"use client";

import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { DialogShell } from "@/components/dialogs/DialogShell";
import {
  BoardPresetGrid,
  MatchDialogFooter,
  MatchDialogHeader,
  PlayerCountField,
  type MatchConfig
} from "@/components/dialogs/MatchDialogParts";
import { DEFAULT_BOARD_PRESET, presetForGrid } from "@/lib/presets";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/constants";

interface PlayDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: MatchConfig) => void;
  onInteract?: () => void;
}

const STORAGE_KEY = "cr.play.settings";

const DEFAULT_CONFIG: MatchConfig = {
  players: 2,
  gridRows: DEFAULT_BOARD_PRESET.gridRows,
  gridCols: DEFAULT_BOARD_PRESET.gridCols
};

// Restores the last-played settings; anything missing or invalid falls back
// to the defaults wholesale.
function loadSavedConfig(): MatchConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MatchConfig>;
      const preset = presetForGrid(Number(parsed.gridRows), Number(parsed.gridCols));
      const players = Number(parsed.players);
      if (preset && Number.isInteger(players) && players >= MIN_PLAYERS && players <= MAX_PLAYERS) {
        return { players, gridRows: preset.gridRows, gridCols: preset.gridCols };
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_CONFIG;
}

export function PlayDialog({ open, onClose, onConfirm, onInteract }: PlayDialogProps) {
  const [config, setConfig] = useState<MatchConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (open) setConfig(loadSavedConfig());
  }, [open]);

  function handleConfirm() {
    onInteract?.();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* storage unavailable, still play */
    }
    onConfirm(config);
  }

  return (
    <DialogShell open={open} onClose={onClose} titleId="play-title" width="lg" accent="primary">
      <div className="grid gap-4 p-4 sm:gap-6 sm:p-7">
        <MatchDialogHeader titleId="play-title" title="QUICK" highlight="MATCH" onClose={onClose} />

        <section className="grid gap-2 sm:gap-3">
          <p className="font-display text-xs tracking-[0.28em] text-fg-muted">BOARD SIZE</p>
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
        </section>

        <PlayerCountField
          players={config.players}
          onChange={(players) => {
            setConfig((current) => ({ ...current, players }));
            onInteract?.();
          }}
        />

        <MatchDialogFooter
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel="Find match"
          confirmIcon={<Play size={16} strokeWidth={3} fill="currentColor" aria-hidden="true" />}
        />
      </div>
    </DialogShell>
  );
}
