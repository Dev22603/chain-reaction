"use client";

import { Play } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BOARD_PRESETS } from "@/lib/presets";
import type { JoinQueueInput } from "@/lib/types";

interface LobbyProps {
  onSubmit: (input: JoinQueueInput) => void;
  onInteract?: () => void;
}

export function Lobby({ onSubmit, onInteract }: LobbyProps) {
  const [playerName, setPlayerName] = useState("");
  const [gridRows, setGridRows] = useState(6);
  const [gridCols, setGridCols] = useState(9);
  const [maxPlayers, setMaxPlayers] = useState(2);

  const trimmedName = playerName.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName) return;
    onInteract?.();
    onSubmit({ playerName: trimmedName, gridRows, gridCols, maxPlayers });
  }

  return (
    <Card
      className="mx-auto mt-[6vh] w-[min(520px,100%)] p-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]"
      aria-labelledby="lobby-title"
    >
      <CardCorners />
      <header className="mb-8 grid gap-3">
        <div className="flex items-center justify-between">
          <CardEyebrow>// reactor.console v1.0</CardEyebrow>
          <span className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.32em] text-radium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-radium/60" />
              <span className="relative h-2 w-2 rounded-full bg-radium" />
            </span>
            online
          </span>
        </div>
        <CardTitle id="lobby-title" className="leading-[0.95]">
          Chain
          <br />
          <span className="text-reactor [text-shadow:0_0_24px_rgba(255,91,46,0.55)]">Reaction</span>
        </CardTitle>
        <p className="max-w-md text-xs leading-relaxed text-fg-muted">
          Stack orbs. Trigger criticality. Saturate the lattice before your rivals do - the last reactor
          standing wins.
        </p>
      </header>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <Input
          name="player-name"
          label="Operator ID"
          value={playerName}
          maxLength={100}
          onChange={(event) => setPlayerName(event.target.value)}
          placeholder="enter callsign..."
          autoComplete="off"
        />

        <fieldset className="grid gap-3 border-0 p-0">
          <legend className="font-display text-[10px] uppercase tracking-[0.32em] text-fg-soft">
            Lattice Preset
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BOARD_PRESETS.map((preset) => {
              const active = gridRows === preset.gridRows && gridCols === preset.gridCols;

              return (
                <Button
                  key={preset.label}
                  variant={active ? "segmentActive" : "segment"}
                  className="h-auto flex-col py-3 text-[10px]"
                  onClick={() => {
                    onInteract?.();
                    setGridRows(preset.gridRows);
                    setGridCols(preset.gridCols);
                  }}
                >
                  <span>{preset.label}</span>
                  <span className="font-mono text-[10px] normal-case tracking-[0.12em] opacity-75">
                    {preset.gridRows} x {preset.gridCols}
                  </span>
                </Button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="rows"
            label="Rows"
            type="number"
            min={3}
            max={20}
            value={gridRows}
            onChange={(event) => setGridRows(Number(event.target.value))}
          />

          <Input
            name="cols"
            label="Cols"
            type="number"
            min={3}
            max={20}
            value={gridCols}
            onChange={(event) => setGridCols(Number(event.target.value))}
          />
        </div>

        <fieldset className="grid gap-3 border-0 p-0">
          <legend className="font-display text-[10px] uppercase tracking-[0.32em] text-fg-soft">
            Reactors
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {[2, 3, 4].map((count) => (
              <Button
                key={count}
                variant={maxPlayers === count ? "segmentActive" : "segment"}
                onClick={() => {
                  onInteract?.();
                  setMaxPlayers(count);
                }}
              >
                {count}
              </Button>
            ))}
          </div>
        </fieldset>

        <Button
          type="submit"
          size="lg"
          variant="primary"
          disabled={!trimmedName}
          className="mt-2"
        >
          <Play size={16} aria-hidden="true" strokeWidth={2.5} />
          Initiate / Join Queue
        </Button>
      </form>
    </Card>
  );
}
