"use client";

import { Gauge, Play, RadioTower, Users } from "lucide-react";
import { FormEvent, type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BOARD_PRESETS } from "@/lib/presets";
import type { GameMode, JoinQueueInput } from "@/lib/types";

interface LobbyProps {
  onSubmit: (input: JoinQueueInput) => void;
  onInteract?: () => void;
  isAuthenticated?: boolean;
  defaultPlayerName?: string;
}

export function Lobby({ onSubmit, onInteract, isAuthenticated = false, defaultPlayerName = "" }: LobbyProps) {
  const [playerName, setPlayerName] = useState("");
  const [gridRows, setGridRows] = useState(6);
  const [gridCols, setGridCols] = useState(9);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [mode, setMode] = useState<GameMode>("casual");

  const trimmedName = playerName.trim();
  const rankedLocked = mode === "ranked" && !isAuthenticated;

  useEffect(() => {
    if (defaultPlayerName) {
      setPlayerName(defaultPlayerName);
    }
  }, [defaultPlayerName]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName || rankedLocked) return;
    onInteract?.();
    onSubmit({ mode, playerName: trimmedName, gridRows, gridCols, maxPlayers });
  }

  return (
    <Card
      className="mx-auto grid w-full max-w-[1040px] gap-0 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both] lg:grid-cols-[0.92fr_1.08fr]"
      aria-labelledby="lobby-title"
    >
      <CardCorners />
      <section className="relative grid content-between gap-8 border-b border-line/80 p-5 sm:p-8 lg:min-h-[640px] lg:border-b-0 lg:border-r">
        <header className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardEyebrow>// reactor.console v1.0</CardEyebrow>
            <span className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.28em] text-radium">
              <RadioTower size={13} aria-hidden="true" />
              online
            </span>
          </div>
          <CardTitle id="lobby-title" className="text-[clamp(2.6rem,13vw,5.8rem)] leading-[0.88]">
            Chain
            <br />
            <span className="text-reactor [text-shadow:0_0_24px_rgba(255,91,46,0.55)]">Reaction</span>
          </CardTitle>
          <p className="max-w-md text-sm leading-relaxed text-fg-muted">
            Stack orbs, trigger criticality, and overwhelm the lattice before rival reactors can stabilize.
          </p>
        </header>

        <div className="grid gap-3">
          <div className="grid grid-cols-3 overflow-hidden border border-line bg-bg-soft/70">
            <Readout icon={<Gauge size={15} />} label="grid" value={`${gridRows} x ${gridCols}`} />
            <Readout icon={<Users size={15} />} label="reactors" value={String(maxPlayers)} />
            <Readout label="mode" value={mode} />
          </div>
          <div className="relative aspect-[16/9] overflow-hidden border border-line bg-black/50">
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(37,211,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,91,46,0.14) 1px, transparent 1px)",
                backgroundSize: `calc(100% / ${gridCols}) calc(100% / ${gridRows})`
              }}
            />
            <span className="absolute left-[18%] top-[24%] h-5 w-5 rounded-full bg-p1 shadow-[0_0_28px_rgba(255,59,107,0.85)]" />
            <span className="absolute left-[52%] top-[42%] h-4 w-4 rounded-full bg-p2 shadow-[0_0_28px_rgba(37,211,255,0.85)]" />
            <span className="absolute bottom-[20%] right-[18%] h-3 w-3 rounded-full bg-uranium shadow-[0_0_22px_rgba(255,210,63,0.8)]" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-line bg-bg/75 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted backdrop-blur">
              <span>match preview</span>
              <span className="text-cherenkov">armed</span>
            </div>
          </div>
        </div>
      </section>

      <section className="p-5 sm:p-8 lg:p-10">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div className="grid gap-2">
            <CardEyebrow>// queue setup</CardEyebrow>
            <h2 className="font-display text-2xl uppercase tracking-[0.05em] text-fg sm:text-3xl">
              Configure Run
            </h2>
          </div>
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-radium/60" />
            <span className="relative h-2 w-2 rounded-full bg-radium" />
          </span>
        </div>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <Input
          name="player-name"
          label="Operator ID"
          value={playerName}
          maxLength={100}
          disabled={isAuthenticated}
          onChange={(event) => setPlayerName(event.target.value)}
          placeholder="enter callsign..."
          autoComplete="nickname"
          hint={isAuthenticated ? "Using your account display name." : undefined}
        />

        <fieldset className="grid gap-3 border-0 p-0">
          <legend className="font-display text-[10px] uppercase tracking-[0.32em] text-fg-soft">
            Queue
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(["casual", "ranked"] as const).map((queueMode) => (
              <Button
                key={queueMode}
                variant={mode === queueMode ? "segmentActive" : "segment"}
                onClick={() => {
                  onInteract?.();
                  setMode(queueMode);
                }}
              >
                {queueMode}
              </Button>
            ))}
          </div>
          {rankedLocked ? (
            <p className="font-mono text-[11px] leading-relaxed text-p1">
              Login is required for ranked queue.
            </p>
          ) : null}
        </fieldset>

        <fieldset className="grid gap-3 border-0 p-0">
          <legend className="font-display text-[10px] uppercase tracking-[0.32em] text-fg-soft">
            Lattice Preset
          </legend>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {BOARD_PRESETS.map((preset) => {
              const active = gridRows === preset.gridRows && gridCols === preset.gridCols;

              return (
                <Button
                  key={preset.label}
                  variant={active ? "segmentActive" : "segment"}
                  className="h-auto flex-col px-2 py-3 text-[10px]"
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
          disabled={!trimmedName || rankedLocked}
          className="mt-2"
        >
          <Play size={16} aria-hidden="true" strokeWidth={2.5} />
          Initiate / Join Queue
        </Button>
      </form>
      </section>
    </Card>
  );
}

function Readout({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-1 border-r border-line px-3 py-3 last:border-r-0">
      <span className="flex min-w-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted">
        {icon}
        {label}
      </span>
      <span className="truncate font-display text-sm uppercase tracking-[0.12em] text-fg">{value}</span>
    </div>
  );
}
