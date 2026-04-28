"use client";

import { Play } from "lucide-react";
import { FormEvent, useState } from "react";
import { BOARD_PRESETS } from "@/lib/presets";
import type { JoinQueueInput } from "@/lib/types";

interface LobbyProps {
  onSubmit: (input: JoinQueueInput) => void;
}

export function Lobby({ onSubmit }: LobbyProps) {
  const [playerName, setPlayerName] = useState("");
  const [gridRows, setGridRows] = useState(6);
  const [gridCols, setGridCols] = useState(9);
  const [maxPlayers, setMaxPlayers] = useState(2);

  const trimmedName = playerName.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName) {
      return;
    }

    onSubmit({ playerName: trimmedName, gridRows, gridCols, maxPlayers });
  }

  return (
    <section className="panel lobby-panel" aria-labelledby="lobby-title">
      <div>
        <p className="eyebrow">Real-time multiplayer</p>
        <h1 id="lobby-title">Chain Reaction</h1>
      </div>

      <form className="lobby-form" onSubmit={handleSubmit}>
        <label>
          Player name
          <input
            value={playerName}
            maxLength={100}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Alice"
          />
        </label>

        <div className="control-grid">
          <label>
            Preset
            <select
              value={`${gridRows}x${gridCols}`}
              onChange={(event) => {
                const preset = BOARD_PRESETS.find(
                  (item) => `${item.gridRows}x${item.gridCols}` === event.target.value
                );
                if (preset) {
                  setGridRows(preset.gridRows);
                  setGridCols(preset.gridCols);
                }
              }}
            >
              {BOARD_PRESETS.map((preset) => (
                <option key={preset.label} value={`${preset.gridRows}x${preset.gridCols}`}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Rows
            <input
              type="number"
              min={3}
              max={20}
              value={gridRows}
              onChange={(event) => setGridRows(Number(event.target.value))}
            />
          </label>

          <label>
            Columns
            <input
              type="number"
              min={3}
              max={20}
              value={gridCols}
              onChange={(event) => setGridCols(Number(event.target.value))}
            />
          </label>
        </div>

        <fieldset>
          <legend>Players</legend>
          <div className="segmented">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                className={maxPlayers === count ? "active" : ""}
                onClick={() => setMaxPlayers(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="primary-button" type="submit" disabled={!trimmedName}>
          <Play size={18} aria-hidden="true" />
          Join queue
        </button>
      </form>
    </section>
  );
}
